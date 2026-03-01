import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../services/api';

const initialState = {
  coupons: [],
  couponDetails: null,
  loading: false,
  error: null,
  success: null,
  page: 1,
  totalPages: 1,
  total: 0,
};

export const fetchCoupons = createAsyncThunk(
  'adminCoupons/fetchCoupons',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await api.get('/api/admin/coupons', { params });
      return { data: res.data, params };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Unable to load coupons.';
      return rejectWithValue(message);
    }
  }
);

export const fetchCouponDetails = createAsyncThunk(
  'adminCoupons/fetchCouponDetails',
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.get(`/api/admin/coupons/${id}`);
      return res.data.coupon;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Unable to load coupon.';
      return rejectWithValue(message);
    }
  }
);

export const createCoupon = createAsyncThunk(
  'adminCoupons/createCoupon',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await api.post('/api/admin/coupons', payload);
      return res.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Unable to create coupon.';
      return rejectWithValue(message);
    }
  }
);

export const updateCoupon = createAsyncThunk(
  'adminCoupons/updateCoupon',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/admin/coupons/${id}`, data);
      return res.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Unable to update coupon.';
      return rejectWithValue(message);
    }
  }
);

export const deleteCoupon = createAsyncThunk(
  'adminCoupons/deleteCoupon',
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.delete(`/admin/coupons/${id}`);
      return { id, message: res.data.message };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Unable to delete coupon.';
      return rejectWithValue(message);
    }
  }
);

export const toggleCouponStatus = createAsyncThunk(
  'adminCoupons/toggleCouponStatus',
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.patch(`/admin/coupons/${id}/toggle`);
      return { id, ...res.data };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Unable to toggle coupon.';
      return rejectWithValue(message);
    }
  }
);

const adminCouponSlice = createSlice({
  name: 'adminCoupons',
  initialState,
  reducers: {
    clearAdminCouponMessages(state) {
      state.error = null;
      state.success = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCoupons.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(fetchCoupons.fulfilled, (state, action) => {
        state.loading = false;
        state.coupons = action.payload.data.coupons || [];
        state.page = action.payload.data.page || 1;
        state.totalPages = action.payload.data.totalPages || 1;
        state.total = action.payload.data.total || 0;
      })
      .addCase(fetchCoupons.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Unable to load coupons.';
      })
      .addCase(fetchCouponDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCouponDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.couponDetails = action.payload;
      })
      .addCase(fetchCouponDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Unable to load coupon.';
      })
      .addCase(createCoupon.pending, (state) => {
        state.error = null;
        state.success = null;
      })
      .addCase(createCoupon.fulfilled, (state, action) => {
        state.success = action.payload.message || 'Coupon created successfully.';
      })
      .addCase(createCoupon.rejected, (state, action) => {
        state.error = action.payload || 'Unable to create coupon.';
      })
      .addCase(updateCoupon.pending, (state) => {
        state.error = null;
        state.success = null;
      })
      .addCase(updateCoupon.fulfilled, (state, action) => {
        state.success = action.payload.message || 'Coupon updated successfully.';
      })
      .addCase(updateCoupon.rejected, (state, action) => {
        state.error = action.payload || 'Unable to update coupon.';
      })
      .addCase(deleteCoupon.pending, (state) => {
        state.error = null;
        state.success = null;
      })
      .addCase(deleteCoupon.fulfilled, (state, action) => {
        state.coupons = state.coupons.filter(
          (c) => String(c._id) !== String(action.payload.id)
        );
        state.success = action.payload.message || 'Coupon deleted successfully.';
      })
      .addCase(deleteCoupon.rejected, (state, action) => {
        state.error = action.payload || 'Unable to delete coupon.';
      })
      .addCase(toggleCouponStatus.pending, (state) => {
        state.error = null;
        state.success = null;
      })
      .addCase(toggleCouponStatus.fulfilled, (state, action) => {
        const { id, isActive, message } = action.payload;
        state.coupons = state.coupons.map((c) =>
          String(c._id) === String(id) ? { ...c, isActive } : c
        );
        state.success = message || 'Coupon status updated.';
      })
      .addCase(toggleCouponStatus.rejected, (state, action) => {
        state.error = action.payload || 'Unable to toggle coupon.';
      });
  },
});

export const { clearAdminCouponMessages } = adminCouponSlice.actions;

export default adminCouponSlice.reducer;

