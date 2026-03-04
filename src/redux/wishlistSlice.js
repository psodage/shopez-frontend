import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../services/api';

const STORAGE_KEY = 'shopez_wishlist_v1';

const baseState = {
  items: [],
  totalItems: 0,
  recentlyAddedIds: [],
  lastSyncedAt: null,
};

const loadInitialState = () => {
  if (typeof window === 'undefined') return baseState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return baseState;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.items)) return baseState;
    return { ...baseState, ...parsed };
  } catch {
    return baseState;
  }
};

const persist = (state) => {
  const snapshot = {
    items: state.items,
    totalItems: state.totalItems,
    recentlyAddedIds: state.recentlyAddedIds,
    lastSyncedAt: state.lastSyncedAt,
  };
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  }
};

const baseAddItem = (state, product, options = {}) => {
  if (!product?.id) return;
  const existing = state.items.find((it) => it.id === product.id);
  if (existing) {
    if (options.touchExisting !== false) {
      state.recentlyAddedIds = [
        product.id,
        ...state.recentlyAddedIds.filter((id) => id !== product.id),
      ].slice(0, 12);
    }
    return;
  }
  state.items.unshift(product);
  state.totalItems = state.items.length;
  state.recentlyAddedIds = [
    product.id,
    ...state.recentlyAddedIds.filter((id) => id !== product.id),
  ].slice(0, 12);
};

export const fetchWishlist = createAsyncThunk(
  'wishlist/fetchWishlist',
  async (_, { getState, rejectWithValue }) => {
    const token = getState().auth.token;
    if (!token) return null;
    try {
      const res = await api.get('/api/wishlist');
      return res.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        'Failed to sync wishlist. Using local copy.';
      return rejectWithValue(message);
    }
  }
);

export const addWishlistItem = createAsyncThunk(
  'wishlist/addWishlistItem',
  async (payload, { getState, rejectWithValue }) => {
    const token = getState().auth.token;
    if (!token) {
      return { localOnly: true, payload };
    }
    try {
      const res = await api.post('/api/wishlist/add', {
        productId: payload.id,
      });
      return res.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        'Failed to update wishlist. Item kept locally.';
      return rejectWithValue({ message, payload });
    }
  }
);

export const removeWishlistItem = createAsyncThunk(
  'wishlist/removeWishlistItem',
  async (id, { getState, rejectWithValue }) => {
    const token = getState().auth.token;
    if (!token) {
      return { localOnly: true, id };
    }
    try {
      const res = await api.delete(`/api/wishlist/remove/${id}`);
      return res.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        'Failed to update wishlist. Item removed locally.';
      return rejectWithValue({ message, id });
    }
  }
);

const initialState = loadInitialState();

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    addToWishlistLocal(state, action) {
      baseAddItem(state, action.payload);
      persist(state);
    },
    removeFromWishlistLocal(state, action) {
      const id = action.payload;
      state.items = state.items.filter((it) => it.id !== id);
      state.totalItems = state.items.length;
      state.recentlyAddedIds = state.recentlyAddedIds.filter(
        (itemId) => itemId !== id
      );
      persist(state);
    },
    clearWishlist(state) {
      state.items = [];
      state.totalItems = 0;
      state.recentlyAddedIds = [];
      persist(state);
    },
    hydrateWishlist(state, action) {
      const next = action.payload;
      if (!next || !Array.isArray(next.items)) return;
      state.items = next.items;
      state.totalItems = next.items.length;
      state.recentlyAddedIds = next.items
        .map((it) => it.id)
        .filter(Boolean)
        .slice(0, 12);
      state.lastSyncedAt = new Date().toISOString();
      persist(state);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        if (!action.payload) return;
        const data = action.payload;
        if (!Array.isArray(data.items)) return;
        state.items = data.items;
        state.totalItems = data.items.length;
        state.recentlyAddedIds = data.items
          .map((it) => it.id)
          .filter(Boolean)
          .slice(0, 12);
        state.lastSyncedAt = new Date().toISOString();
        persist(state);
      })
      .addCase(addWishlistItem.fulfilled, (state, action) => {
        const data = action.payload;
        if (data?.localOnly) {
          baseAddItem(state, data.payload);
          persist(state);
          return;
        }
        if (!data || !Array.isArray(data.items)) return;
        state.items = data.items;
        state.totalItems = data.items.length;
        state.recentlyAddedIds = [
          data.lastAddedId,
          ...state.recentlyAddedIds.filter((id) => id !== data.lastAddedId),
        ]
          .filter(Boolean)
          .slice(0, 12);
        state.lastSyncedAt = new Date().toISOString();
        persist(state);
      })
      .addCase(addWishlistItem.rejected, (state, action) => {
        const payload = action.payload;
        if (payload?.payload) {
          baseAddItem(state, payload.payload);
          persist(state);
        }
      })
      .addCase(removeWishlistItem.fulfilled, (state, action) => {
        const data = action.payload;
        if (data?.localOnly) {
          const id = data.id;
          state.items = state.items.filter((it) => it.id !== id);
          state.totalItems = state.items.length;
          state.recentlyAddedIds = state.recentlyAddedIds.filter(
            (itemId) => itemId !== id
          );
          persist(state);
          return;
        }
        if (!data || !Array.isArray(data.items)) return;
        state.items = data.items;
        state.totalItems = data.items.length;
        state.recentlyAddedIds = state.recentlyAddedIds.filter((id) =>
          data.items.some((it) => it.id === id)
        );
        state.lastSyncedAt = new Date().toISOString();
        persist(state);
      })
      .addCase(removeWishlistItem.rejected, (state, action) => {
        const payload = action.payload;
        if (payload?.id) {
          const id = payload.id;
          state.items = state.items.filter((it) => it.id !== id);
          state.totalItems = state.items.length;
          state.recentlyAddedIds = state.recentlyAddedIds.filter(
            (itemId) => itemId !== id
          );
          persist(state);
        }
      });
  },
});

export const {
  addToWishlistLocal,
  removeFromWishlistLocal,
  clearWishlist,
  hydrateWishlist,
} = wishlistSlice.actions;

export const selectIsInWishlist = (state, productId) =>
  !!state.wishlist.items.find((it) => it.id === productId);

export const selectWishlistCount = (state) => state.wishlist.totalItems;

export const selectRecentlyAddedWishlist = (state) => {
  const ids = state.wishlist.recentlyAddedIds;
  if (!ids || ids.length === 0) return [];
  const map = new Map(state.wishlist.items.map((it) => [it.id, it]));
  return ids.map((id) => map.get(id)).filter(Boolean);
};

export default wishlistSlice.reducer;

