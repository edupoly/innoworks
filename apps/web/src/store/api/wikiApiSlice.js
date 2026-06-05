import { apiSlice } from './apiSlice';

export const wikiApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getWikiPages: builder.query({
      query: (projectId) => `/wiki/${projectId}`,
      providesTags: (result, error, projectId) => [{ type: 'Wiki', id: projectId }],
    }),
    getWikiPage: builder.query({
      query: ({ projectId, slug }) => `/wiki/${projectId}/${slug}`,
      providesTags: (result, error, { projectId, slug }) => [{ type: 'WikiPage', id: `${projectId}-${slug}` }],
    }),
    createWikiPage: builder.mutation({
      query: ({ projectId, title, content }) => ({
        url: `/wiki/${projectId}`,
        method: 'POST',
        body: { title, content },
      }),
      invalidatesTags: (result, error, { projectId }) => [{ type: 'Wiki', id: projectId }],
    }),
    updateWikiPage: builder.mutation({
      query: ({ projectId, pageId, content, changeSummary }) => ({
        url: `/wiki/${projectId}/${pageId}`,
        method: 'PUT',
        body: { content, changeSummary },
      }),
      invalidatesTags: (result, error, { projectId, slug }) => [
        { type: 'Wiki', id: projectId },
        { type: 'WikiPage', id: `${projectId}-${slug}` }
      ],
    }),
    submitWikiForApproval: builder.mutation({
      query: ({ projectId, pageId, changeSummary }) => ({
        url: `/wiki/${projectId}/${pageId}/request-approval`,
        method: 'POST',
        body: { changeSummary },
      }),
      invalidatesTags: (result, error, { projectId }) => [{ type: 'Wiki', id: projectId }],
    }),
    approveWikiPage: builder.mutation({
      query: ({ projectId, pageId, requestId, comment }) => ({
        url: `/wiki/${projectId}/${pageId}/approve`,
        method: 'PUT',
        body: { requestId, comment },
      }),
      invalidatesTags: (result, error, { projectId, slug }) => [
        { type: 'Wiki', id: projectId },
        { type: 'WikiPage', id: `${projectId}-${slug}` }
      ],
    }),
  }),
});

export const {
  useGetWikiPagesQuery,
  useGetWikiPageQuery,
  useCreateWikiPageMutation,
  useUpdateWikiPageMutation,
  useSubmitWikiForApprovalMutation,
  useApproveWikiPageMutation,
} = wikiApiSlice;
