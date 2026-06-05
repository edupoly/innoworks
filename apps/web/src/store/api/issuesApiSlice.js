import { apiSlice } from './apiSlice';

export const issuesApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getIssues: builder.query({
      query: (projectId) => `/issues/${projectId}`,
      providesTags: (result, error, projectId) => [{ type: 'Issue', id: projectId }],
    }),
    createIssue: builder.mutation({
      query: ({ projectId, ...data }) => ({
        url: `/issues/${projectId}`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { projectId }) => [{ type: 'Issue', id: projectId }],
    }),
    updateIssue: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/issues/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id, projectId }) => [
        { type: 'Issue', id: projectId }
      ],
    }),
  }),
});

export const {
  useGetIssuesQuery,
  useCreateIssueMutation,
  useUpdateIssueMutation,
} = issuesApiSlice;
