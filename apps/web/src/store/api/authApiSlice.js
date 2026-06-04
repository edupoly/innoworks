import { apiSlice } from './apiSlice';

export const authApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMe: builder.query({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),
    getRepos: builder.query({
      query: () => '/auth/repos',
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
