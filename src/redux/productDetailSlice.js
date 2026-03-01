import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../services/api';

export const fetchProductById = createAsyncThunk(
  'productDetail/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.get(`/api/products/${id}`);
      return res.data?.product;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        'Failed to load product details. Please try again.';
      return rejectWithValue(message);
    }
  }
);

export const submitReview = createAsyncThunk(
  'productDetail/submitReview',
  async ({ id, rating, comment }, { rejectWithValue }) => {
    try {
      const res = await api.post(`/api/products/${id}/reviews`, { rating, comment });
      return res.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        'Failed to submit review. Please try again.';
      return rejectWithValue(message);
    }
  }
);

export const fetchRelatedProducts = createAsyncThunk(
  'productDetail/fetchRelated',
  async ({ category, excludeId }, { rejectWithValue }) => {
    try {
      const res = await api.get('/api/products', {
        params: { category, limit: 8, sort: 'latest' },
      });
      const list = res.data?.products || [];
      return list.filter((p) => (p.id || p._id) !== excludeId).slice(0, 4);
    } catch (error) {
      const message =
        error.response?.data?.message ||
        'Failed to load related products.';
      return rejectWithValue(message);
    }
  }
);

const initialState = {
  product: null,
  related: [],
  loading: false,
  error: null,
  // Track which async request is the latest so we can ignore stale responses.
  currentRequestId: null,
  reviewSubmitting: false,
  reviewSuccess: null,
  reviewError: null,
  relatedLoading: false,
  relatedError: null,
};

const productDetailSlice = createSlice({
  name: 'productDetail',
  initialState,
  reducers: {
    clearReviewStatus(state) {
      state.reviewSuccess = null;
      state.reviewError = null;
    },
    resetProductDetail() {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProductById.pending, (state, action) => {
        state.loading = true;
        state.error = null;
        state.product = null;
        state.currentRequestId = action.meta.requestId;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        // Ignore stale responses from older requests
        if (state.currentRequestId !== action.meta.requestId) return;
        state.loading = false;
        state.product = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        // Ignore stale errors from older requests
        if (state.currentRequestId !== action.meta.requestId) return;
        state.loading = false;
        state.error = action.payload || 'Failed to load product.';
      })
      .addCase(submitReview.pending, (state) => {
        state.reviewSubmitting = true;
        state.reviewError = null;
        state.reviewSuccess = null;
      })
      .addCase(submitReview.fulfilled, (state, action) => {
        state.reviewSubmitting = false;
        state.reviewSuccess = action.payload?.message || 'Review submitted.';
        if (state.product) {
          state.product.reviews = action.payload?.reviews || state.product.reviews;
          state.product.numReviews =
            action.payload?.numReviews ?? state.product.numReviews;
          state.product.rating = action.payload?.rating ?? state.product.rating;
        }
      })
      .addCase(submitReview.rejected, (state, action) => {
        state.reviewSubmitting = false;
        state.reviewError = action.payload || 'Failed to submit review.';
      })
      .addCase(fetchRelatedProducts.pending, (state) => {
        state.relatedLoading = true;
        state.relatedError = null;
      })
      .addCase(fetchRelatedProducts.fulfilled, (state, action) => {
        state.relatedLoading = false;
        state.related = action.payload || [];
      })
      .addCase(fetchRelatedProducts.rejected, (state, action) => {
        state.relatedLoading = false;
        state.relatedError = action.payload || 'Failed to load related products.';
      });
  },
});

export const { clearReviewStatus, resetProductDetail } = productDetailSlice.actions;

export default productDetailSlice.reducer;

