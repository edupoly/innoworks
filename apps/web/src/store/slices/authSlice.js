import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../lib/api";

export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { dispatch }) => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      dispatch(logout());
      // Clear React Query cache
      window.location.href = "/";
    }
  }
);

const initialState = {
  user: null,
  token: null,
  isAuthenticated: !!localStorage.getItem("token"),
  loading: !!localStorage.getItem("token"),
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, token } = action.payload;
      if (user !== undefined) state.user = user;
      if (token !== undefined) state.token = token;
      state.isAuthenticated = true;
      state.loading = false;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
});

export const { setCredentials, logout, setLoading } = authSlice.actions;
export default authSlice.reducer;
