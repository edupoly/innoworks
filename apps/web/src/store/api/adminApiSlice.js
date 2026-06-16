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
      invalidatesTags: ['AdminUsers', 'User', 'AuditLogs'],
    }),
    updateUserStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/admin/users/${id}/status`,
        method: 'PUT',
        body: { status },
      }),
      invalidatesTags: ['AdminUsers', 'User', 'AuditLogs'],
    }),
    deleteUser: builder.mutation({
      query: (id) => ({
        url: `/admin/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AdminUsers', 'AuditLogs'],
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
      invalidatesTags: ['Project', 'AuditLogs'],
    }),
    getAdminRequests: builder.query({
      query: ({ page = 1 }) => `/admin/requests?page=${page}`,
      providesTags: ['ApprovalRequest'],
    }),
    getModerationStats: builder.query({
      query: () => '/admin/moderation/stats',
      providesTags: ['Moderation'],
    }),
    getModerationList: builder.query({
      query: ({ type, page = 1, search = '', verified }) => 
        `/admin/moderation/list/${type}?page=${page}&search=${search}${verified !== undefined ? `&verified=${verified}` : ''}`,
      providesTags: (result, error, { type }) => [{ type: 'Moderation', id: type }],
    }),
    verifyItem: builder.mutation({
      query: ({ type, id, verify, reason }) => ({
        url: `/admin/moderation/verify/${type}/${id}`,
        method: 'PUT',
        body: { verify, reason },
      }),
      invalidatesTags: (result, error, { type }) => ['Moderation', 'Project', 'Issue', 'Submission', 'Wiki', { type: 'Moderation', id: type }],
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
  useGetModerationStatsQuery,
  useGetModerationListQuery,
  useVerifyItemMutation,
} = adminApiSlice;
