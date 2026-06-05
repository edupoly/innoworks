import { apiSlice } from './apiSlice';
import { initiateSocket } from '../../lib/socket';

export const usersApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getLeaderboard: builder.query({
      query: (period) => `/users/leaderboard${period ? `?period=${period}` : ''}`,
      providesTags: ['Leaderboard'],
      async onCacheEntryAdded(arg, { updateCachedData, cacheDataLoaded, cacheEntryRemoved }) {
        const socket = initiateSocket();
        let lastUpdate = 0;
        const THROTTLE_MS = 2000; // Only update every 2s for real-time feel without overhead

        try {
          await cacheDataLoaded;
          const handleUpdate = (update) => {
            const now = Date.now();
            if (now - lastUpdate < THROTTLE_MS) return;
            
            updateCachedData((draft) => {
              const userIndex = draft.findIndex(u => (u._id || u.id) === update.userId);
              if (userIndex !== -1) {
                Object.assign(draft[userIndex], update);
                draft.sort((a, b) => (b.xp || 0) - (a.xp || 0));
              }
            });
            lastUpdate = now;
          };
          socket.on('leaderboardUpdate', handleUpdate);
        } catch {}
        await cacheEntryRemoved;
        socket.off('leaderboardUpdate');
      }
    }),
    getNotifications: builder.query({
      query: () => '/users/notifications',
      providesTags: ['Notification'],
      async onCacheEntryAdded(arg, { updateCachedData, cacheDataLoaded, cacheEntryRemoved }) {
        const socket = initiateSocket();
        try {
          await cacheDataLoaded;
          const handleNotification = (notification) => {
            updateCachedData((draft) => {
              if (!draft.find(n => n._id === notification._id)) {
                draft.unshift(notification);
              }
            });
          };
          socket.on('notification', handleNotification);
        } catch {}
        await cacheEntryRemoved;
        socket.off('notification');
      }
    }),
    markNotificationsRead: builder.mutation({
      query: () => ({
        url: '/users/notifications/read-all',
        method: 'PUT',
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          usersApiSlice.util.updateQueryData('getNotifications', undefined, (draft) => {
            draft.forEach((n) => {
              n.read = true;
            });
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
      invalidatesTags: ['Notification'],
    }),
    markNotificationRead: builder.mutation({
      query: (id) => ({
        url: `/users/notifications/${id}/read`,
        method: 'PUT',
      }),
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          usersApiSlice.util.updateQueryData('getNotifications', undefined, (draft) => {
            const notification = draft.find((n) => n._id === id);
            if (notification) {
              notification.read = true;
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
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
