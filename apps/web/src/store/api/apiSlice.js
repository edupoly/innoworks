import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const BASE_URL = import.meta.env.VITE_API_URL || "https://innoworks-api.up.railway.app";

export const apiSlice = createApi({
  reducerPath: 'api',
  refetchOnFocus: true,
  refetchOnReconnect: true,
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['User', 'Project', 'Submission', 'Notification', 'Leaderboard', 'Repos'],
  endpoints: () => ({}),
});
