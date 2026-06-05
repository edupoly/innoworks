import { apiSlice } from './apiSlice';

export const adminApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query({
      query: ({ page = 1, search = '' }) => `/admin/users?page=${page}&search=${search}`,
      providesTags: ['AdminUsers'],
    }),
    updateUserRole: builder.mutation({
      query: ({ id, role, permissions }) => ({
        url: `/admin/users/${id}/role`,
        method: 'PUT',
        body: { role, permissions },
      }),
      invalidatesTags: ['AdminUsers', 'User'],
    }),
    getAuditLogs: builder.query({
      query: ({ page = 1 }) => `/admin/logs?page=${page}`,
      providesTags: ['AuditLogs'],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useUpdateUserRoleMutation,
  useGetAuditLogsQuery,
} = adminApiSlice;
