import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../services/api';
import { TOKEN_KEY } from '../constants/auth';

const storedToken = localStorage.getItem(TOKEN_KEY);

const initialState = {
  user: null,
  token: storedToken || null,
  loading: false,
  // When there's a stored token but no user yet, we are restoring the session.
  restoring: !!storedToken,
  error: null,
  success: null,
};

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/auth/login', credentials);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Unable to login. Please try again.';
      return rejectWithValue(message);
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/auth/register', payload);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Unable to register. Please try again.';
      return rejectWithValue(message);
    }
  }
);

export const fetchCurrentUser = createAsyncThunk(
  'auth/fetchCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/auth/me');
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
      }
      return rejectWithValue(error.response?.data?.message || 'Session expired.');
    }
  }
);

export const registerAdmin = createAsyncThunk(
  'auth/registerAdmin',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.post('/api/auth/register-admin', payload);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Unable to register admin. Please try again.';
      return rejectWithValue(message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthMessages(state) {
      state.error = null;
      state.success = null;
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.restoring = false;
      localStorage.removeItem(TOKEN_KEY);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user || null;
        state.token = action.payload.token;
        state.success = 'Logged in successfully.';
        if (action.payload.token) {
          localStorage.setItem(TOKEN_KEY, action.payload.token);
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Login failed.';
      })
      .addCase(fetchCurrentUser.pending, (state) => {
        state.restoring = true;
      })
      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.restoring = false;
        state.user = action.payload?.user || null;
      })
      .addCase(fetchCurrentUser.rejected, (state, action) => {
        state.restoring = false;
        state.user = null;
        state.token = null;
      })
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.success =
          action.payload?.message || 'Registered successfully. You can now log in.';
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Registration failed.';
      })
      .addCase(registerAdmin.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = null;
      })
      .addCase(registerAdmin.fulfilled, (state, action) => {
        state.loading = false;
        state.success =
          action.payload?.message ||
          'Admin registered successfully. They can now log in.';
      })
      .addCase(registerAdmin.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Admin registration failed.';
      });
  },
});

export const { clearAuthMessages, logout } = authSlice.actions;

export default authSlice.reducer;
