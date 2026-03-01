import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../services/api';

const initialState = {
  banners: [],
  bannerDetails: null,
  loading: false,
  error: null,
  success: null,
  page: 1,
  totalPages: 1,
  total: 0,
};

export const fetchBanners = createAsyncThunk(
  'adminBanners/fetchBanners',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await api.get('/api/admin/banners', { params });
      return { data: res.data, params };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Unable to load banners.';
      return rejectWithValue(message);
    }
  }
);

export const fetchBannerDetails = createAsyncThunk(
  'adminBanners/fetchBannerDetails',
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.get(`/api/admin/banners/${id}`);
      return res.data.banner;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Unable to load banner.';
      return rejectWithValue(message);
    }
  }
);

export const createBanner = createAsyncThunk(
  'adminBanners/createBanner',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await api.post('/api/admin/banners', payload);
      return res.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Unable to create banner.';
      return rejectWithValue(message);
    }
  }
);

export const updateBanner = createAsyncThunk(
  'adminBanners/updateBanner',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/admin/banners/${id}`, data);
      return res.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Unable to update banner.';
      return rejectWithValue(message);
    }
  }
);

export const deleteBanner = createAsyncThunk(
  'adminBanners/deleteBanner',
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.delete(`/admin/banners/${id}`);
      return { id, message: res.data.message };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Unable to delete banner.';
      return rejectWithValue(message);
    }
  }
);

export const toggleBannerStatus = createAsyncThunk(
  'adminBanners/toggleBannerStatus',
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/admin/banners/${id}/toggle`);
      return { id, ...res.data };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Unable to toggle banner.';
      return rejectWithValue(message);
    }
  }
);

const adminBannerSlice = createSlice({
  name: 'adminBanners',
  initialState,
  reducers: {
    clearAdminBannerMessages(state) {
      state.error = null;
      state.success = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBanners.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(fetchBanners.fulfilled, (state, action) => {
        state.loading = false;
        state.banners = action.payload.data.banners || [];
        state.page = action.payload.data.page || 1;
        state.totalPages = action.payload.data.totalPages || 1;
        state.total = action.payload.data.total || 0;
      })
      .addCase(fetchBanners.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Unable to load banners.';
      })
      .addCase(fetchBannerDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBannerDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.bannerDetails = action.payload;
      })
      .addCase(fetchBannerDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Unable to load banner.';
      })
      .addCase(createBanner.pending, (state) => {
        state.error = null;
        state.success = null;
      })
      .addCase(createBanner.fulfilled, (state, action) => {
        state.success = action.payload.message || 'Banner created successfully.';
      })
      .addCase(createBanner.rejected, (state, action) => {
        state.error = action.payload || 'Unable to create banner.';
      })
      .addCase(updateBanner.pending, (state) => {
        state.error = null;
        state.success = null;
      })
      .addCase(updateBanner.fulfilled, (state, action) => {
        state.success = action.payload.message || 'Banner updated successfully.';
      })
      .addCase(updateBanner.rejected, (state, action) => {
        state.error = action.payload || 'Unable to update banner.';
      })
      .addCase(deleteBanner.pending, (state) => {
        state.error = null;
        state.success = null;
      })
      .addCase(deleteBanner.fulfilled, (state, action) => {
        state.banners = state.banners.filter(
          (b) => String(b._id) !== String(action.payload.id)
        );
        state.success = action.payload.message || 'Banner deleted successfully.';
      })
      .addCase(deleteBanner.rejected, (state, action) => {
        state.error = action.payload || 'Unable to delete banner.';
      })
      .addCase(toggleBannerStatus.pending, (state) => {
        state.error = null;
        state.success = null;
      })
      .addCase(toggleBannerStatus.fulfilled, (state, action) => {
        const { id, isActive, message } = action.payload;
        state.banners = state.banners.map((b) =>
          String(b._id) === String(id) ? { ...b, isActive } : b
        );
        state.success = message || 'Banner status updated.';
      })
      .addCase(toggleBannerStatus.rejected, (state, action) => {
        state.error = action.payload || 'Unable to toggle banner.';
      });
  },
});

export const { clearAdminBannerMessages } = adminBannerSlice.actions;

export default adminBannerSlice.reducer;

