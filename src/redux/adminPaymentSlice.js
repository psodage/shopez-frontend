import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../services/api';

const initialState = {
  payments: [],
  paymentDetails: null,
  loading: false,
  error: null,
  success: null,
  page: 1,
  totalPages: 1,
  total: 0,
};

export const fetchPayments = createAsyncThunk(
  'adminPayments/fetchPayments',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await api.get('/api/admin/payments', { params });
      return { data: res.data, params };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Unable to load payments.';
      return rejectWithValue(message);
    }
  }
);

export const fetchPaymentDetails = createAsyncThunk(
  'adminPayments/fetchPaymentDetails',
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.get(`/api/admin/payments/${id}`);
      return res.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Unable to load payment details.';
      return rejectWithValue(message);
    }
  }
);

export const processRefund = createAsyncThunk(
  'adminPayments/processRefund',
  async ({ id, amount, reason }, { rejectWithValue }) => {
    try {
      const res = await api.post(`/api/admin/payments/${id}/refund`, {
        amount,
        reason,
      });
      return res.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Unable to process refund.';
      return rejectWithValue(message);
    }
  }
);

const adminPaymentSlice = createSlice({
  name: 'adminPayments',
  initialState,
  reducers: {
    clearAdminPaymentMessages(state) {
      state.error = null;
      state.success = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPayments.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(fetchPayments.fulfilled, (state, action) => {
        state.loading = false;
        state.payments = action.payload.data.payments || [];
        state.page = action.payload.data.page || 1;
        state.totalPages = action.payload.data.totalPages || 1;
        state.total = action.payload.data.total || 0;
      })
      .addCase(fetchPayments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Unable to load payments.';
      })
      .addCase(fetchPaymentDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPaymentDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.paymentDetails = action.payload;
      })
      .addCase(fetchPaymentDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Unable to load payment details.';
      })
      .addCase(processRefund.pending, (state) => {
        state.error = null;
        state.success = null;
      })
      .addCase(processRefund.fulfilled, (state, action) => {
        state.success =
          action.payload.message || 'Refund processed successfully.';
        if (action.payload.payment) {
          // Keep the detailed view in sync after a refund.
          if (state.paymentDetails?.payment?._id === action.payload.payment._id) {
            state.paymentDetails = {
              ...state.paymentDetails,
              payment: action.payload.payment,
            };
          }
          state.payments = state.payments.map((p) =>
            String(p._id) === String(action.payload.payment._id)
              ? action.payload.payment
              : p
          );
        }
      })
      .addCase(processRefund.rejected, (state, action) => {
        state.error = action.payload || 'Unable to process refund.';
      });
  },
});

export const { clearAdminPaymentMessages } = adminPaymentSlice.actions;

export default adminPaymentSlice.reducer;

