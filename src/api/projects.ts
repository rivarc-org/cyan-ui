import { apiRequest } from './client';
import type {
  ProjectResponse,
  CreateProjectRequest,
  CreateProjectResponse,
  DeployResponse,
  StopResponse,
} from './types';

export const projectsApi = {
  list: () => apiRequest<ProjectResponse[]>('/projects'),

  get: (id: string) => apiRequest<ProjectResponse>(`/projects/${id}`),

  create: (data: CreateProjectRequest) =>
    apiRequest<CreateProjectResponse>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiRequest<void>(`/projects/${id}`, { method: 'DELETE' }),

  deploy: (id: string, revisionId: string) =>
    apiRequest<DeployResponse>(`/projects/${id}/deploy`, {
      method: 'POST',
      body: JSON.stringify({ revision_id: revisionId }),
    }),

  stop: (id: string) =>
    apiRequest<StopResponse>(`/projects/${id}/stop`, {
      method: 'POST',
    }),
};
