import { apiSlice } from './apiSlice';

export const dockerApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getDockerAssets: builder.query({
      query: (projectId) => `/docker/${projectId}`,
      providesTags: (result, error, projectId) => [{ type: 'Docker', id: projectId }],
    }),
    uploadDockerAsset: builder.mutation({
      query: ({ projectId, ...data }) => ({
        url: `/docker/${projectId}/upload`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { projectId }) => [{ type: 'Docker', id: projectId }],
    }),
    approveDockerAsset: builder.mutation({
      query: ({ projectId, assetId }) => ({
        url: `/docker/${projectId}/assets/${assetId}/approve`,
        method: 'PUT',
      }),
      invalidatesTags: (result, error, { projectId }) => [{ type: 'Docker', id: projectId }],
    }),
  }),
});

export const {
  useGetDockerAssetsQuery,
  useUploadDockerAssetMutation,
  useApproveDockerAssetMutation,
} = dockerApiSlice;
