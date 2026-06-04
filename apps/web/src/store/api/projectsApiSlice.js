import { apiSlice } from './apiSlice';

export const projectsApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getProjects: builder.query({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params?.search) queryParams.append('search', params.search);
        if (params?.difficulty) queryParams.append('difficulty', params.difficulty);
        if (params?.skill) queryParams.append('skill', params.skill);
        if (params?.sort) queryParams.append('sort', params.sort);
        if (params?.tech) queryParams.append('tech', params.tech);
        
        return `/projects?${queryParams.toString()}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.map(({ _id }) => ({ type: 'Project', id: _id })),
              { type: 'Project', id: 'LIST' },
            ]
          : [{ type: 'Project', id: 'LIST' }],
    }),
    getProject: builder.query({
      query: (id) => `/projects/${id}`,
      providesTags: (result, error, id) => [{ type: 'Project', id }],
    }),
    getProjectIntelligence: builder.query({
      query: (id) => `/projects/${id}/intelligence`,
      providesTags: (result, error, id) => [{ type: 'Project', id: `INTEL-${id}` }],
    }),
    getProjectForkStatus: builder.query({
      query: (id) => `/projects/${id}/fork-status`,
    }),
    createProject: builder.mutation({
      query: (newProject) => ({
        url: '/projects',
        method: 'POST',
        body: newProject,
      }),
      invalidatesTags: [{ type: 'Project', id: 'LIST' }, 'User'],
    }),
    updateProject: builder.mutation({
      query: ({ id, ...update }) => ({
        url: `/projects/${id}`,
        method: 'PUT',
        body: update,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Project', id },
        { type: 'Project', id: 'LIST' },
      ],
    }),
    deleteProject: builder.mutation({
      query: (id) => ({
        url: `/projects/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Project', id: 'LIST' }, 'User'],
    }),
    acceptProject: builder.mutation({
      query: (id) => ({
        url: `/projects/${id}/accept`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => ['User', { type: 'Project', id }],
    }),
    closeProjectIssue: builder.mutation({
      query: ({ id, issueNumber }) => ({
        url: `/projects/${id}/issues/${issueNumber}/close`,
        method: 'PATCH',
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Project', id: `INTEL-${id}` }],
    }),
    createProjectIssue: builder.mutation({
      query: ({ id, ...issueData }) => ({
        url: `/projects/${id}/issues`,
        method: 'POST',
        body: issueData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Project', id: `INTEL-${id}` }],
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useGetProjectQuery,
  useGetProjectIntelligenceQuery,
  useGetProjectForkStatusQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useAcceptProjectMutation,
  useCloseProjectIssueMutation,
  useCreateProjectIssueMutation,
} = projectsApiSlice;
