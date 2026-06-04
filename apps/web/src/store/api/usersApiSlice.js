import { apiSlice } from './apiSlice';

export const usersApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getLeaderboard: builder.query({
      query: (period) => `/users/leaderboard${period ? `?period=${period}` : ''}`,
      providesTags: ['Leaderboard'],
    }),
    getNotifications: builder.query({
      query: () => '/users/notifications',
      providesTags: ['Notification'],
    }),
    markNotificationsRead: builder.mutation({
      query: () => ({
        url: '/users/notifications/read-all',
        method: 'PUT',
      }),
      invalidatesTags: ['Notification'],
    }),
    markNotificationRead: builder.mutation({
      query: (id) => ({
        url: `/users/notifications/${id}/read`,
        method: 'PUT',
      }),
      invalidatesTags: ['Notification'],
    }),
    updateProfile: builder.mutation({
      query: (data) => ({
        url: '/users/profile',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['User', 'Leaderboard'],
    }),
    getUserProfile: builder.query({
      query: (username) => `/users/profile/${username}`,
      providesTags: (result, error, username) => [{ type: 'User', id: username }],
    }),
  }),
});

export const {
  useGetLeaderboardQuery,
  useGetNotificationsQuery,
  useMarkNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useUpdateProfileMutation,
  useGetUserProfileQuery,
} = usersApiSlice;
