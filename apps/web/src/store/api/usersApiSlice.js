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
        const THROTTLE_MS = 3000; // Increased to 3s for maximum stabilization

        try {
          await cacheDataLoaded;
          const handleUpdate = (update) => {
            const now = Date.now();
            if (now - lastUpdate < THROTTLE_MS) return;
            
            lastUpdate = now;
            updateCachedData((draft) => {
              if (!Array.isArray(draft)) return;
              const userIndex = draft.findIndex(u => (u._id || u.id) === update.userId);
              if (userIndex !== -1) {
                // Surgically update only the fields that changed
                Object.assign(draft[userIndex], update);
                // Sort the draft after update
                draft.sort((a, b) => (b.contributionScore || 0) - (a.contributionScore || 0));
              }
            });
          };
          socket.on('leaderboardUpdate', handleUpdate);
        } catch (err) {
          console.error("Leaderboard socket sync error:", err);
        }
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
        } catch (err) {
          console.error("Leaderboard socket sync error:", err);
        }
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
