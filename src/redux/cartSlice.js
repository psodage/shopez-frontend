import { createSlice } from '@reduxjs/toolkit';

// Single source of truth for cart state persisted in localStorage.
// All derived values (totals, delivery, discounts) are recomputed in one place.
const STORAGE_KEY = 'shopez_cart_v1';

const baseState = {
  items: [],
  cartItems: [],
  totalItems: 0,
  subtotal: 0,
  deliveryFee: 0,
  couponCode: '',
  discountAmount: 0,
  savedForLater: [],
};

// Load cart from localStorage, falling back safely to a clean base state.
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

// After every mutation, recompute derived cart fields and snapshot them to localStorage.
// This keeps components simple: they can read totals directly from state.
const persistAndRecalc = (state) => {
  state.cartItems = state.items;
  state.totalItems = state.items.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0
  );
  state.subtotal = state.items.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );

  if (!state.subtotal || state.subtotal <= 0) {
    state.deliveryFee = 0;
  } else {
    state.deliveryFee = state.subtotal >= 100 ? 0 : 7;
  }

  // Ensure discount is never negative or more than subtotal.
  const discount = Number(state.discountAmount || 0);
  if (!discount || discount < 0) {
    state.discountAmount = 0;
  } else {
    state.discountAmount = Math.min(discount, state.subtotal);
  }

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        items: state.items,
        cartItems: state.cartItems,
        totalItems: state.totalItems,
        subtotal: state.subtotal,
        deliveryFee: state.deliveryFee,
        couponCode: state.couponCode,
        discountAmount: state.discountAmount,
        savedForLater: state.savedForLater,
      })
    );
  }
};

const initialState = loadInitialState();

// Cart slice manages local cart items, a "saved for later" list and coupon state.
const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart(state, action) {
      const payload = action.payload;
      const id = payload.id;
      if (!id) return;
      const exists = state.items.find((item) => item.id === id);
      const qtyToAdd = Math.max(1, Number(payload.quantity || 1));
      const stock = payload.stock ?? exists?.stock ?? Infinity;
      if (exists) {
        exists.quantity = Math.min(
          Number(exists.quantity || 0) + qtyToAdd,
          Number(stock)
        );
        exists.stock = stock;
      } else {
        state.items.push({
          ...payload,
          quantity: Math.min(qtyToAdd, Number(stock)),
          stock,
        });
      }
      // Cart contents changed; drop any previously applied coupon.
      state.couponCode = '';
      state.discountAmount = 0;
      persistAndRecalc(state);
    },
    updateQuantity(state, action) {
      const { id, quantity } = action.payload;
      const item = state.items.find((i) => i.id === id);
      if (!item) return;
      const q = Math.max(1, Number(quantity || 1));
      const stock = item.stock ?? Infinity;
      item.quantity = Math.min(q, Number(stock));
      state.couponCode = '';
      state.discountAmount = 0;
      persistAndRecalc(state);
    },
    removeFromCart(state, action) {
      state.items = state.items.filter((item) => item.id !== action.payload);
      state.couponCode = '';
      state.discountAmount = 0;
      persistAndRecalc(state);
    },
    clearCart(state) {
      state.items = [];
      state.couponCode = '';
      state.discountAmount = 0;
      persistAndRecalc(state);
    },
    saveForLater(state, action) {
      const id = action.payload;
      const idx = state.items.findIndex((i) => i.id === id);
      if (idx === -1) return;
      const [item] = state.items.splice(idx, 1);
      state.savedForLater.push(item);
      state.couponCode = '';
      state.discountAmount = 0;
      persistAndRecalc(state);
    },
    moveFromSavedToCart(state, action) {
      const id = action.payload;
      const idx = state.savedForLater.findIndex((i) => i.id === id);
      if (idx === -1) return;
      const [item] = state.savedForLater.splice(idx, 1);
      const exists = state.items.find((i) => i.id === id);
      if (exists) {
        exists.quantity = Math.max(
          Number(exists.quantity || 1),
          Number(item.quantity || 1)
        );
      } else {
        state.items.push(item);
      }
      state.couponCode = '';
      state.discountAmount = 0;
      persistAndRecalc(state);
    },
    applyCoupon(state, action) {
      const { code, discount } = action.payload || {};
      state.couponCode = (code || '').trim().toUpperCase();
      state.discountAmount = Number(discount || 0);
      persistAndRecalc(state);
    },
    clearCoupon(state) {
      state.couponCode = '';
      state.discountAmount = 0;
      persistAndRecalc(state);
    },
    hydrateCart(state, action) {
      const next = action.payload;
      if (!next || !Array.isArray(next.items)) return;
      state.items = next.items;
      state.savedForLater = next.savedForLater || [];
      state.couponCode = next.couponCode || '';
      persistAndRecalc(state);
    },
  },
});

export const {
  addToCart,
  updateQuantity,
  removeFromCart,
  clearCart,
  saveForLater,
  moveFromSavedToCart,
  applyCoupon,
  clearCoupon,
  hydrateCart,
} = cartSlice.actions;

export default cartSlice.reducer;


