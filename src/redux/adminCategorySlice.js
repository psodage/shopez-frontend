import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../services/api';

export const fetchCategories = createAsyncThunk(
  'adminCategories/fetchCategories',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await api.get('/api/admin/categories', { params });
      return res.data;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Failed to load categories.';
      return rejectWithValue(message);
    }
  }
);

export const fetchCategoryDetails = createAsyncThunk(
  'adminCategories/fetchCategoryDetails',
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.get(`/api/admin/categories/${id}`);
      return res.data.category;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Failed to load category.';
      return rejectWithValue(message);
    }
  }
);

export const fetchCategoryHierarchy = createAsyncThunk(
  'adminCategories/fetchCategoryHierarchy',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/api/admin/categories/hierarchy');
      return res.data.categories;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Failed to load category hierarchy.';
      return rejectWithValue(message);
    }
  }
);

export const createCategory = createAsyncThunk(
  'adminCategories/createCategory',
  async (formData, { rejectWithValue }) => {
    try {
      const res = await api.post('/api/admin/categories', formData);
      return res.data;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Failed to create category.';
      return rejectWithValue(message);
    }
  }
);

export const updateCategory = createAsyncThunk(
  'adminCategories/updateCategory',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/api/admin/categories/${id}`, data);
      return res.data;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Failed to update category.';
      return rejectWithValue(message);
    }
  }
);

export const deleteCategory = createAsyncThunk(
  'adminCategories/deleteCategory',
  async ({ id, hard }, { rejectWithValue }) => {
    try {
      const params = hard ? { hard: 'true' } : {};
      const res = await api.delete(`/api/admin/categories/${id}`, { params });
      return { id, message: res.data?.message || 'Category deactivated.', deactivated: res.data?.deactivated };
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Failed to delete category.';
      return rejectWithValue(message);
    }
  }
);

const initialState = {
  categories: [],
  categoryDetails: null,
  hierarchy: [],
  loading: false,
  error: null,
  success: null,
  page: 1,
  totalPages: 1,
  total: 0,
  tree: false,
};

const adminCategorySlice = createSlice({
  name: 'adminCategories',
  initialState,
  reducers: {
    clearAdminCategoryMessages(state) {
      state.error = null;
      state.success = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload.categories || [];
        state.page = action.payload.page || 1;
        state.totalPages = action.payload.totalPages || 1;
        state.total = action.payload.total || 0;
        state.tree = action.payload.tree || false;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error =
          typeof action.payload === 'string'
            ? action.payload
            : 'Failed to load categories.';
      })
      .addCase(fetchCategoryDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategoryDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.categoryDetails = action.payload;
      })
      .addCase(fetchCategoryDetails.rejected, (state, action) => {
        state.loading = false;
        state.error =
          typeof action.payload === 'string'
            ? action.payload
            : 'Failed to load category.';
      })
      .addCase(fetchCategoryHierarchy.fulfilled, (state, action) => {
        state.hierarchy = action.payload || [];
      })
      .addCase(createCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.success = action.payload?.message || 'Category created.';
        if (action.payload?.category) {
          state.categories.unshift(action.payload.category);
        }
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.loading = false;
        state.error =
          typeof action.payload === 'string'
            ? action.payload
            : 'Failed to create category.';
      })
      .addCase(updateCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.success = action.payload?.message || 'Category updated.';
        const updated = action.payload?.category;
        if (updated) {
          state.categories = state.categories.map((c) =>
            c._id === updated._id ? updated : c
          );
          state.categoryDetails =
            state.categoryDetails && state.categoryDetails._id === updated._id
              ? updated
              : state.categoryDetails;
        }
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.loading = false;
        state.error =
          typeof action.payload === 'string'
            ? action.payload
            : 'Failed to update category.';
      })
      .addCase(deleteCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.success = action.payload?.message || 'Category deactivated.';
        const id = action.payload?.id;
        if (id) {
          const removeFromList = (list) =>
            list.filter((c) => c._id !== id).map((c) =>
              c.children ? { ...c, children: removeFromList(c.children) } : c
            );
          state.categories = removeFromList(state.categories);
        }
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.loading = false;
        state.error =
          typeof action.payload === 'string'
            ? action.payload
            : 'Failed to delete category.';
      });
  },
});

export const { clearAdminCategoryMessages } = adminCategorySlice.actions;

export default adminCategorySlice.reducer;
