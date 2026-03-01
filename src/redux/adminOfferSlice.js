import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../services/api';

const initialState = {
  offers: [],
  offerDetails: null,
  loading: false,
  error: null,
  success: null,
  page: 1,
  totalPages: 1,
  total: 0,
};

export const fetchOffers = createAsyncThunk(
  'adminOffers/fetchOffers',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await api.get('/api/admin/offers', { params });
      return { data: res.data, params };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Unable to load offers.';
      return rejectWithValue(message);
    }
  }
);

export const fetchOfferDetails = createAsyncThunk(
  'adminOffers/fetchOfferDetails',
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.get(`/api/admin/offers/${id}`);
      return res.data.offer;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Unable to load offer.';
      return rejectWithValue(message);
    }
  }
);

export const createOffer = createAsyncThunk(
  'adminOffers/createOffer',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await api.post('/api/admin/offers', payload);
      return res.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Unable to create offer.';
      return rejectWithValue(message);
    }
  }
);

export const updateOffer = createAsyncThunk(
  'adminOffers/updateOffer',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/admin/offers/${id}`, data);
      return res.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Unable to update offer.';
      return rejectWithValue(message);
    }
  }
);

export const deleteOffer = createAsyncThunk(
  'adminOffers/deleteOffer',
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.delete(`/admin/offers/${id}`);
      return { id, message: res.data.message };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Unable to delete offer.';
      return rejectWithValue(message);
    }
  }
);

const adminOfferSlice = createSlice({
  name: 'adminOffers',
  initialState,
  reducers: {
    clearAdminOfferMessages(state) {
      state.error = null;
      state.success = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOffers.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(fetchOffers.fulfilled, (state, action) => {
        state.loading = false;
        state.offers = action.payload.data.offers || [];
        state.page = action.payload.data.page || 1;
        state.totalPages = action.payload.data.totalPages || 1;
        state.total = action.payload.data.total || 0;
      })
      .addCase(fetchOffers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Unable to load offers.';
      })
      .addCase(fetchOfferDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOfferDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.offerDetails = action.payload;
      })
      .addCase(fetchOfferDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Unable to load offer.';
      })
      .addCase(createOffer.pending, (state) => {
        state.error = null;
        state.success = null;
      })
      .addCase(createOffer.fulfilled, (state, action) => {
        state.success = action.payload.message || 'Offer created successfully.';
      })
      .addCase(createOffer.rejected, (state, action) => {
        state.error = action.payload || 'Unable to create offer.';
      })
      .addCase(updateOffer.pending, (state) => {
        state.error = null;
        state.success = null;
      })
      .addCase(updateOffer.fulfilled, (state, action) => {
        state.success = action.payload.message || 'Offer updated successfully.';
      })
      .addCase(updateOffer.rejected, (state, action) => {
        state.error = action.payload || 'Unable to update offer.';
      })
      .addCase(deleteOffer.pending, (state) => {
        state.error = null;
        state.success = null;
      })
      .addCase(deleteOffer.fulfilled, (state, action) => {
        state.offers = state.offers.filter(
          (o) => String(o._id) !== String(action.payload.id)
        );
        state.success = action.payload.message || 'Offer deleted successfully.';
      })
      .addCase(deleteOffer.rejected, (state, action) => {
        state.error = action.payload || 'Unable to delete offer.';
      });
  },
});

export const { clearAdminOfferMessages } = adminOfferSlice.actions;

export default adminOfferSlice.reducer;

