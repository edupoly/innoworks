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
    updateUserStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/admin/users/${id}/status`,
        method: 'PUT',
        body: { status },
      }),
      invalidatesTags: ['AdminUsers', 'User'],
    }),
    deleteUser: builder.mutation({
      query: (id) => ({
        url: `/admin/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AdminUsers'],
    }),
    getAuditLogs: builder.query({
      query: ({ page = 1 }) => `/admin/logs?page=${page}`,
      providesTags: ['AuditLogs'],
    }),
    getAdminProjects: builder.query({
      query: ({ page = 1, search = '' }) => `/admin/projects?page=${page}&search=${search}`,
      providesTags: ['Project'],
    }),
    deleteAdminProject: builder.mutation({
      query: (id) => ({
        url: `/admin/projects/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Project'],
    }),
    getAdminRequests: builder.query({
      query: ({ page = 1 }) => `/admin/requests?page=${page}`,
      providesTags: ['ApprovalRequest'], // Need to add to tagTypes if not present, but can use 'Wiki' or custom
    }),
  }),
});

export const {
  useGetUsersQuery,
  useUpdateUserRoleMutation,
  useUpdateUserStatusMutation,
  useDeleteUserMutation,
  useGetAuditLogsQuery,
  useGetAdminProjectsQuery,
  useDeleteAdminProjectMutation,
  useGetAdminRequestsQuery,
} = adminApiSlice;
