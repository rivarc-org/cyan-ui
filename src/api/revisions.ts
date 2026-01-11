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

  create: (projectId: string, graphState: GraphStateDTO, isDraft: boolean = true) =>
    apiRequest<RevisionDetailResponse>(`/projects/${projectId}/revisions`, {
      method: 'POST',
      body: JSON.stringify({ graph_state: graphState, is_draft: isDraft }),
    }),

  delete: (projectId: string, revisionId: string) =>
    apiRequest<void>(`/projects/${projectId}/revisions/${revisionId}`, {
      method: 'DELETE',
    }),
  update: (projectId: string, revisionId: string, graphState: GraphStateDTO) =>
    apiRequest<RevisionDetailResponse>(
      `/projects/${projectId}/revisions/${revisionId}`,
      {
        method: 'POST',
        body: JSON.stringify({ graph_state: graphState }),
      }
    ),
};
