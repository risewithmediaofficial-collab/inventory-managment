import { createSlice } from '@reduxjs/toolkit';

const getStoredAuth = () => {
  try {
    const stored = localStorage.getItem('erp_auth');
    return stored ? JSON.parse(stored) : null;
  } catch { return null; }
};

const storedAuth = getStoredAuth();

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: storedAuth?.user || null,
    accessToken: storedAuth?.accessToken || null,
    refreshToken: storedAuth?.refreshToken || null,
    isAuthenticated: !!storedAuth?.accessToken,
    isLoading: false,
  },
  reducers: {
    setAuth: (state, action) => {
      const { user, accessToken, refreshToken } = action.payload;
      state.user = user;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      state.isAuthenticated = true;
      state.isLoading = false;
      localStorage.setItem('erp_auth', JSON.stringify({ user, accessToken, refreshToken }));
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      localStorage.removeItem('erp_auth');
    },
    setUser: (state, action) => {
      state.user = action.payload;
      const stored = getStoredAuth();
      if (stored) {
        localStorage.setItem('erp_auth', JSON.stringify({ ...stored, user: action.payload }));
      }
    },
    refreshTokens: (state, action) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      const stored = getStoredAuth();
      if (stored) {
        localStorage.setItem('erp_auth', JSON.stringify({
          ...stored,
          accessToken: action.payload.accessToken,
          refreshToken: action.payload.refreshToken,
        }));
      }
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setAuth, logout, setUser, refreshTokens, setLoading } = authSlice.actions;
export default authSlice.reducer;
