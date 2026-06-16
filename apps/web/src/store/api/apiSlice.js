import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { logout, setCredentials } from '../slices/authSlice';

const BASE_URL = import.meta.env.VITE_API_URL || "https://innoworks-api.up.railway.app";
const cleanBaseUrl = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;

const baseQuery = fetchBaseQuery({
  baseUrl: cleanBaseUrl,
  prepareHeaders: (headers) => {
    const token = localStorage.getItem('token');
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error && result.error.status === 401) {
    const isAuthPath = window.location.pathname === '/' || window.location.pathname.includes('/auth/callback');
    const refreshToken = localStorage.getItem('refreshToken');

    if (!isAuthPath && refreshToken) {
      // Try to get a new token
      const refreshResult = await baseQuery(
        {
          url: '/auth/refresh',
          method: 'POST',
          body: { refreshToken },
        },
        api,
        extraOptions
      );

      if (refreshResult.data) {
        const { token } = refreshResult.data;
        // Store the new token
        localStorage.setItem('token', token);
        
        // Update Redux state if possible
        api.dispatch(setCredentials({ token }));

        // Retry the original query with the new token
        result = await baseQuery(args, api, extraOptions);
      } else {
        // Refresh failed
        api.dispatch(logout());
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        if (!isAuthPath) window.location.href = '/';
      }
    } else if (!isAuthPath) {
      api.dispatch(logout());
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      window.location.href = '/';
    }
  }
  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  refetchOnFocus: true,
  refetchOnReconnect: true,
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'Project', 'Submission', 'Notification', 'Leaderboard', 'Repos', 'AdminUsers', 'AuditLogs', 'Wiki', 'WikiPage', 'Issue', 'Docker', 'ApprovalRequest', 'Evaluation', 'Moderation'],
  endpoints: () => ({}),
});
