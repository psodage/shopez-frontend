import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../services/api';

const initialState = {
  revenueStats: null,
  loading: false,
  error: null,
  success: null,
};

export const fetchRevenueStats = createAsyncThunk(
  'adminRevenue/fetchRevenueStats',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/api/admin/revenue');
      return res.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Unable to load revenue stats.';
      return rejectWithValue(message);
    }
  }
);

const adminRevenueSlice = createSlice({
  name: 'adminRevenue',
  initialState,
  reducers: {
    clearAdminRevenueMessages(state) {
      state.error = null;
      state.success = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRevenueStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRevenueStats.fulfilled, (state, action) => {
        state.loading = false;
        state.revenueStats = action.payload;
      })
      .addCase(fetchRevenueStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Unable to load revenue stats.';
      });
  },
});

export const { clearAdminRevenueMessages } = adminRevenueSlice.actions;

export default adminRevenueSlice.reducer;

