import { apiRequest } from './client';
import type {
  RevisionSummary,
  RevisionDetailResponse,
  GraphStateDTO,
} from './types';

export const revisionsApi = {
  list: (projectId: string) =>
    apiRequest<RevisionSummary[]>(`/projects/${projectId}/revisions`),

  get: (projectId: string, revisionId: string) =>
    apiRequest<RevisionDetailResponse>(
      `/projects/${projectId}/revisions/${revisionId}`
    ),

  getLatest: (projectId: string) =>
    apiRequest<RevisionDetailResponse>(
      `/projects/${projectId}/revisions/latest`
    ),

  create: (projectId: string, graphState: GraphStateDTO) =>
    apiRequest<RevisionDetailResponse>(`/projects/${projectId}/revisions`, {
      method: 'POST',
      body: JSON.stringify({ graph_state: graphState }),
    }),
};
