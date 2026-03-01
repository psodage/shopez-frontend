import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../services/api';

const initialState = {
  reviews: [],
  reviewDetails: null,
  analytics: null,
  loading: false,
  error: null,
  success: null,
  page: 1,
  totalPages: 1,
  total: 0,
};

export const fetchReviews = createAsyncThunk(
  'adminReviews/fetchReviews',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/admin/reviews', { params });
      return { data: response.data, params };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Unable to load reviews.';
      return rejectWithValue(message);
    }
  }
);

export const fetchReviewDetails = createAsyncThunk(
  'adminReviews/fetchReviewDetails',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/admin/reviews/${id}`);
      return response.data.review;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Unable to load review details.';
      return rejectWithValue(message);
    }
  }
);

export const updateReviewStatus = createAsyncThunk(
  'adminReviews/updateReviewStatus',
  async ({ id, status, moderationNote }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/api/admin/reviews/${id}/status`, {
        status,
        moderationNote,
      });
      return { id, status, moderationNote, message: response.data.message };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Unable to update review.';
      return rejectWithValue(message);
    }
  }
);

export const deleteReview = createAsyncThunk(
  'adminReviews/deleteReview',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/api/admin/reviews/${id}`);
      return { id, message: response.data.message };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Unable to delete review.';
      return rejectWithValue(message);
    }
  }
);

export const bulkActionReviews = createAsyncThunk(
  'adminReviews/bulkActionReviews',
  async ({ ids, action }, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/admin/reviews/bulk', { ids, action });
      return { ids, action, message: response.data.message };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Unable to apply bulk action.';
      return rejectWithValue(message);
    }
  }
);

export const fetchReviewAnalytics = createAsyncThunk(
  'adminReviews/fetchReviewAnalytics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/admin/reviews/analytics');
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Unable to load review analytics.';
      return rejectWithValue(message);
    }
  }
);

const adminReviewSlice = createSlice({
  name: 'adminReviews',
  initialState,
  reducers: {
    clearAdminReviewMessages(state) {
      state.error = null;
      state.success = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(fetchReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.reviews = action.payload.data.reviews || [];
        state.page = action.payload.data.page || 1;
        state.totalPages = action.payload.data.totalPages || 1;
        state.total = action.payload.data.total || 0;
      })
      .addCase(fetchReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Unable to load reviews.';
      })
      .addCase(fetchReviewDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReviewDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.reviewDetails = action.payload;
      })
      .addCase(fetchReviewDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Unable to load review details.';
      })
      .addCase(updateReviewStatus.pending, (state) => {
        state.error = null;
        state.success = null;
      })
      .addCase(updateReviewStatus.fulfilled, (state, action) => {
        const { id, status, moderationNote, message } = action.payload;
        state.reviews = state.reviews.map((r) =>
          String(r.reviewId) === String(id)
            ? { ...r, status, moderationNote }
            : r
        );
        if (state.reviewDetails && String(state.reviewDetails.id) === String(id)) {
          state.reviewDetails.status = status;
          state.reviewDetails.moderationNote = moderationNote;
        }
        state.success = message || 'Review updated successfully.';
      })
      .addCase(updateReviewStatus.rejected, (state, action) => {
        state.error = action.payload || 'Unable to update review.';
      })
      .addCase(deleteReview.pending, (state) => {
        state.error = null;
        state.success = null;
      })
      .addCase(deleteReview.fulfilled, (state, action) => {
        const { id, message } = action.payload;
        state.reviews = state.reviews.filter(
          (r) => String(r.reviewId) !== String(id)
        );
        if (state.reviewDetails && String(state.reviewDetails.id) === String(id)) {
          state.reviewDetails = null;
        }
        state.success = message || 'Review deleted successfully.';
      })
      .addCase(deleteReview.rejected, (state, action) => {
        state.error = action.payload || 'Unable to delete review.';
      })
      .addCase(bulkActionReviews.pending, (state) => {
        state.error = null;
        state.success = null;
      })
      .addCase(bulkActionReviews.fulfilled, (state, action) => {
        const { ids, action: bulkAction, message } = action.payload;
        state.reviews = state.reviews.map((r) => {
          if (!ids.some((id) => String(id) === String(r.reviewId))) return r;
          if (bulkAction === 'delete') {
            return null;
          }
          if (bulkAction === 'approve') {
            return { ...r, status: 'approved' };
          }
          if (bulkAction === 'reject') {
            return { ...r, status: 'rejected' };
          }
          if (bulkAction === 'spam') {
            return { ...r, status: 'spam' };
          }
          return r;
        }).filter(Boolean);
        state.success = message || 'Bulk action applied.';
      })
      .addCase(bulkActionReviews.rejected, (state, action) => {
        state.error = action.payload || 'Unable to apply bulk action.';
      })
      .addCase(fetchReviewAnalytics.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchReviewAnalytics.fulfilled, (state, action) => {
        state.analytics = action.payload;
      })
      .addCase(fetchReviewAnalytics.rejected, (state, action) => {
        state.error = action.payload || 'Unable to load review analytics.';
      });
  },
});

export const { clearAdminReviewMessages } = adminReviewSlice.actions;

export default adminReviewSlice.reducer;

