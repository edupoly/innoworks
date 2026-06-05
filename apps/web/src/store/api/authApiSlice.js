import { apiSlice } from './apiSlice';
import { initiateSocket } from '../../lib/socket';

export const authApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMe: builder.query({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),
    getRepos: builder.query({
      query: () => '/auth/repos',
      providesTags: ['Repos'],
      async onCacheEntryAdded(arg, { cacheDataLoaded, cacheEntryRemoved, dispatch }) {
        const socket = initiateSocket();
        try {
          await cacheDataLoaded;
          socket.on('reposUpdated', () => {
            // Invalidate the repos cache to trigger a refetch
            dispatch(authApiSlice.util.invalidateTags(['Repos']));
          });
        } catch {}
        await cacheEntryRemoved;
        socket.off('reposUpdated');
      }
    }),
    getRepoBranches: builder.query({
      query: ({ owner, repo }) => `/auth/repos/${owner}/${repo}/branches`,
    }),
  }),
});

export const {
  useGetMeQuery,
  useGetReposQuery,
  useGetRepoBranchesQuery,
} = authApiSlice;
