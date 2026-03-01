import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../services/api';

export const fetchProducts = createAsyncThunk(
  'adminProducts/fetchProducts',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await api.get('/api/admin/products', { params });
      return res.data;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Failed to load products.';
      return rejectWithValue(message);
    }
  }
);

export const fetchProductDetails = createAsyncThunk(
  'adminProducts/fetchProductDetails',
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.get(`/api/admin/products/${id}`);
      return res.data.product;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Failed to load product.';
      return rejectWithValue(message);
    }
  }
);

export const createProduct = createAsyncThunk(
  'adminProducts/createProduct',
  async (formData, { rejectWithValue }) => {
    try {
      const res = await api.post('/api/admin/products', formData);
      return res.data;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Failed to create product.';
      return rejectWithValue(message);
    }
  }
);

export const updateProduct = createAsyncThunk(
  'adminProducts/updateProduct',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/admin/products/${id}`, data);
      return res.data;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Failed to update product.';
      return rejectWithValue(message);
    }
  }
);

export const deleteProduct = createAsyncThunk(
  'adminProducts/deleteProduct',
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.delete(`/admin/products/${id}`);
      return { id, message: res.data?.message || 'Product deleted.' };
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Failed to delete product.';
      return rejectWithValue(message);
    }
  }
);

const initialState = {
  products: [],
  productDetails: null,
  loading: false,
  error: null,
  success: null,
  page: 1,
  totalPages: 1,
  total: 0,
};

const adminProductSlice = createSlice({
  name: 'adminProducts',
  initialState,
  reducers: {
    clearAdminProductMessages(state) {
      state.error = null;
      state.success = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.products || [];
        state.page = action.payload.page || 1;
        state.totalPages = action.payload.totalPages || 1;
        state.total = action.payload.total || 0;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error =
          typeof action.payload === 'string'
            ? action.payload
            : 'Failed to load products.';
      })
      .addCase(fetchProductDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.productDetails = action.payload;
      })
      .addCase(fetchProductDetails.rejected, (state, action) => {
        state.loading = false;
        state.error =
          typeof action.payload === 'string'
            ? action.payload
            : 'Failed to load product.';
      })
      .addCase(createProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.success = action.payload?.message || 'Product created.';
        if (action.payload?.product) {
          state.products.unshift(action.payload.product);
        }
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.loading = false;
        state.error =
          typeof action.payload === 'string'
            ? action.payload
            : 'Failed to create product.';
      })
      .addCase(updateProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.success = action.payload?.message || 'Product updated.';
        const updated = action.payload?.product;
        if (updated) {
          state.products = state.products.map((p) =>
            p._id === updated._id ? updated : p
          );
          state.productDetails =
            state.productDetails && state.productDetails._id === updated._id
              ? updated
              : state.productDetails;
        }
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.loading = false;
        state.error =
          typeof action.payload === 'string'
            ? action.payload
            : 'Failed to update product.';
      })
      .addCase(deleteProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.success = action.payload?.message || 'Product deleted.';
        state.products = state.products.filter(
          (p) => p._id !== action.payload.id && p.id !== action.payload.id
        );
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.loading = false;
        state.error =
          typeof action.payload === 'string'
            ? action.payload
            : 'Failed to delete product.';
      });
  },
});

export const { clearAdminProductMessages } = adminProductSlice.actions;

export default adminProductSlice.reducer;

