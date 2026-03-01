import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../services/api';

const initialState = {
  order: null,
  orders: [],
  allOrders: [],
  orderDetails: null,
  loading: false,
  error: null,
  success: false,
  currentOrder: null,
  currentLoading: false,
  currentError: null,
};

export const createOrder = createAsyncThunk(
  'order/createOrder',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await api.post('/api/orders', payload);
      return res.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        'Failed to place order. Please try again.';
      return rejectWithValue(message);
    }
  }
);

export const fetchOrderById = createAsyncThunk(
  'order/fetchOrderById',
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.get(`/api/orders/${id}`);
      return res.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        'Unable to load order details. Please refresh.';
      return rejectWithValue(message);
    }
  }
);

export const fetchMyOrders = createAsyncThunk(
  'order/fetchMyOrders',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/api/orders/my');
      return res.data?.orders || [];
    } catch (error) {
      const message =
        error.response?.data?.message ||
        'Unable to load your orders. Please try again.';
      return rejectWithValue(message);
    }
  }
);

export const fetchOrderDetails = createAsyncThunk(
  'order/fetchOrderDetails',
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.get(`/api/orders/${id}`);
      return res.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        'Unable to load order details. Please refresh.';
      return rejectWithValue(message);
    }
  }
);

export const fetchAllOrders = createAsyncThunk(
  'order/fetchAllOrders',
  async (params, { rejectWithValue }) => {
    try {
      const res = await api.get('/api/admin/orders', { params });
      return res.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        'Unable to load orders. Please try again.';
      return rejectWithValue(message);
    }
  }
);

export const updateOrderStatus = createAsyncThunk(
  'order/updateOrderStatus',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/admin/orders/${id}/status`, data);
      return res.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        'Unable to update order status.';
      return rejectWithValue(message);
    }
  }
);

export const cancelOrder = createAsyncThunk(
  'order/cancelOrder',
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.put(`/orders/${id}/cancel`);
      return res.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        'Unable to cancel order.';
      return rejectWithValue(message);
    }
  }
);

export const deleteOrder = createAsyncThunk(
  'order/deleteOrder',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/admin/orders/${id}`);
      return id;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        'Unable to delete order.';
      return rejectWithValue(message);
    }
  }
);

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    clearOrder(state) {
      state.order = null;
      state.orders = [];
      state.orderDetails = null;
      state.loading = false;
      state.error = null;
      state.success = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.order = action.payload;
        state.success = true;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to place order.';
      })
      .addCase(fetchOrderById.pending, (state) => {
        state.currentLoading = true;
        state.currentError = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.currentLoading = false;
        state.currentOrder = action.payload;
        state.orderDetails = action.payload;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.currentLoading = false;
        state.currentError =
          action.payload || 'Unable to load order details.';
      })
      .addCase(fetchMyOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload || [];
      })
      .addCase(fetchMyOrders.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || 'Unable to load your orders.';
      })
      .addCase(fetchOrderDetails.pending, (state) => {
        state.currentLoading = true;
        state.currentError = null;
      })
      .addCase(fetchOrderDetails.fulfilled, (state, action) => {
        state.currentLoading = false;
        state.currentOrder = action.payload;
        state.orderDetails = action.payload;
      })
      .addCase(fetchOrderDetails.rejected, (state, action) => {
        state.currentLoading = false;
        state.currentError =
          action.payload || 'Unable to load order details.';
      })
      .addCase(fetchAllOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.allOrders = action.payload?.orders || [];
      })
      .addCase(fetchAllOrders.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || 'Unable to load orders.';
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const updated = action.payload;
        state.allOrders = state.allOrders.map((o) =>
          o._id === updated._id ? updated : o
        );
        if (state.currentOrder && state.currentOrder._id === updated._id) {
          state.currentOrder = updated;
          state.orderDetails = updated;
        }
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        const updated = action.payload;
        state.orders = state.orders.map((o) =>
          o._id === updated._id ? updated : o
        );
        if (state.currentOrder && state.currentOrder._id === updated._id) {
          state.currentOrder = updated;
          state.orderDetails = updated;
        }
      })
      .addCase(deleteOrder.fulfilled, (state, action) => {
        const id = action.payload;
        state.allOrders = state.allOrders.filter((o) => o._id !== id);
      });
  },
});

export const { clearOrder } = orderSlice.actions;

export default orderSlice.reducer;

