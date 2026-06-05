import { apiSlice } from './apiSlice';

export const submissionsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getProjectSubmissions: builder.query({
      query: (projectId) => `/submissions/project/${projectId}`,
      providesTags: (result, error, projectId) => [{ type: 'Submission', id: `PROJECT-${projectId}` }],
    }),
    getSubmission: builder.query({
      query: (id) => `/submissions/${id}`,
      providesTags: (result, error, id) => [{ type: 'Submission', id }],
    }),
    getOpenTestingSubmissions: builder.query({
      query: () => '/submissions/testing/open',
      providesTags: ['Submission'],
    }),
    createSubmission: builder.mutation({
      query: (submission) => ({
        url: '/submissions',
        method: 'POST',
        body: submission,
      }),
      invalidatesTags: (result, error, { projectId }) => [
        { type: 'Submission', id: `PROJECT-${projectId}` },
        { type: 'Project', id: projectId },
      ],
    }),
    submitReview: builder.mutation({
      query: ({ id, ...review }) => ({
        url: `/submissions/${id}/reviews`,
        method: 'POST',
        body: review,
      }),
      invalidatesTags: (result, error, { projectId, id }) => [
        { type: 'Submission', id: `PROJECT-${projectId}` },
        { type: 'Submission', id },
        { type: 'Project', id: projectId },
        { type: 'Project', id: `INTEL-${projectId}` },
        'User',
      ],
    }),
    mergeSubmission: builder.mutation({
      query: ({ id }) => ({
        url: `/submissions/${id}/merge`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, { id, projectId }) => [
        { type: 'Submission', id },
        { type: 'Submission', id: `PROJECT-${projectId}` },
        { type: 'Project', id: projectId },
        { type: 'Project', id: `INTEL-${projectId}` },
        'User',
      ],
    }),
    rejectSubmission: builder.mutation({
      query: ({ id }) => ({
        url: `/submissions/${id}/reject`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, { id, projectId }) => [
        { type: 'Submission', id },
        { type: 'Submission', id: `PROJECT-${projectId}` },
        { type: 'Project', id: projectId },
        { type: 'Project', id: `INTEL-${projectId}` },
        'User',
      ],
    }),
  }),
});

export const {
  useGetProjectSubmissionsQuery,
  useGetSubmissionQuery,
  useGetOpenTestingSubmissionsQuery,
  useCreateSubmissionMutation,
  useSubmitReviewMutation,
  useMergeSubmissionMutation,
  useRejectSubmissionMutation,
} = submissionsApiSlice;
