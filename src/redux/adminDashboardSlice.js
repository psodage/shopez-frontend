import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../services/api';

export const fetchDashboardStats = createAsyncThunk(
  'adminDashboard/fetchDashboardStats',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await api.get('/api/admin/dashboard', { params });
      return res.data;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Failed to load admin dashboard.';
      return rejectWithValue(message);
    }
  }
);

const initialState = {
  stats: null,
  loading: false,
  error: null,
};

const adminDashboardSlice = createSlice({
  name: 'adminDashboard',
  initialState,
  reducers: {
    resetDashboardState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.loading = false;
        state.error =
          typeof action.payload === 'string'
            ? action.payload
            : 'Failed to load admin dashboard.';
      });
  },
});

export const { resetDashboardState } = adminDashboardSlice.actions;

export default adminDashboardSlice.reducer;

