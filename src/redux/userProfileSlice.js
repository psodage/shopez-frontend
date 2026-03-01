import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../services/api';

const initialState = {
  userInfo: null,
  loading: false,
  error: null,
  success: null,
};

export const fetchProfile = createAsyncThunk(
  'userProfile/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/api/users/profile');
      return res.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        'Unable to load profile. Please try again.';
      return rejectWithValue(message);
    }
  }
);

export const updateProfile = createAsyncThunk(
  'userProfile/updateProfile',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await api.put('/users/profile', payload);
      return res.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        'Unable to update profile. Please try again.';
      return rejectWithValue(message);
    }
  }
);

export const changePassword = createAsyncThunk(
  'userProfile/changePassword',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await api.put('/users/change-password', payload);
      return res.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        'Unable to change password. Please try again.';
      return rejectWithValue(message);
    }
  }
);

export const addAddress = createAsyncThunk(
  'userProfile/addAddress',
  async (payload, { rejectWithValue }) => {
    try {
      const res = await api.post('/api/users/address', payload);
      return res.data.addresses;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        'Unable to add address. Please try again.';
      return rejectWithValue(message);
    }
  }
);

export const updateAddress = createAsyncThunk(
  'userProfile/updateAddress',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/users/address/${id}`, data);
      return res.data.addresses;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        'Unable to update address. Please try again.';
      return rejectWithValue(message);
    }
  }
);

export const deleteAddress = createAsyncThunk(
  'userProfile/deleteAddress',
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.delete(`/users/address/${id}`);
      return res.data.addresses;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        'Unable to delete address. Please try again.';
      return rejectWithValue(message);
    }
  }
);

const userProfileSlice = createSlice({
  name: 'userProfile',
  initialState,
  reducers: {
    clearProfileMessages(state) {
      state.error = null;
      state.success = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.userInfo = action.payload;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Unable to load profile.';
      })
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.userInfo = action.payload;
        state.success = 'Profile updated successfully.';
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Unable to update profile.';
      })
      .addCase(changePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(changePassword.fulfilled, (state, action) => {
        state.loading = false;
        state.success = action.payload?.message || 'Password updated.';
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Unable to change password.';
      })
      .addCase(addAddress.fulfilled, (state, action) => {
        if (state.userInfo) {
          state.userInfo.addresses = action.payload;
        }
        state.success = 'Address added successfully.';
      })
      .addCase(addAddress.rejected, (state, action) => {
        state.error = action.payload || 'Unable to add address.';
      })
      .addCase(updateAddress.fulfilled, (state, action) => {
        if (state.userInfo) {
          state.userInfo.addresses = action.payload;
        }
        state.success = 'Address updated successfully.';
      })
      .addCase(updateAddress.rejected, (state, action) => {
        state.error = action.payload || 'Unable to update address.';
      })
      .addCase(deleteAddress.fulfilled, (state, action) => {
        if (state.userInfo) {
          state.userInfo.addresses = action.payload;
        }
        state.success = 'Address deleted successfully.';
      })
      .addCase(deleteAddress.rejected, (state, action) => {
        state.error = action.payload || 'Unable to delete address.';
      });
  },
});

export const { clearProfileMessages } = userProfileSlice.actions;

export default userProfileSlice.reducer;

