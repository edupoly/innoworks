import { apiSlice } from './apiSlice';

export const evaluationsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    submitEvaluation: builder.mutation({
      query: (data) => ({
        url: '/evaluations',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Evaluation', 'User', 'Project', 'Submission'],
    }),
    getPendingEvaluations: builder.query({
      query: () => '/evaluations/pending',
      providesTags: ['Evaluation'],
    }),
    getUserEvaluations: builder.query({
      query: (username) => `/evaluations/user/${username}`,
      providesTags: (result, error, username) => [{ type: 'Evaluation', id: username }],
    }),
  }),
});

export const {
  useSubmitEvaluationMutation,
  useGetPendingEvaluationsQuery,
  useGetUserEvaluationsQuery,
} = evaluationsApiSlice;
