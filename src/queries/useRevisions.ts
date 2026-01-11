import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { revisionsApi } from '@/api/revisions';
import { queryKeys } from './keys';
import type { GraphStateDTO } from '@/api/types';

/**
 * Fetch list of revisions for a project
 */
export function useRevisions(projectId: string) {
  return useQuery({
    queryKey: queryKeys.revisions.list(projectId),
    queryFn: () => revisionsApi.list(projectId),
    enabled: !!projectId,
  });
}

/**
 * Fetch a single revision with full graph_state
 */
export function useRevision(projectId: string, revisionId: string | null) {
  return useQuery({
    queryKey: queryKeys.revisions.detail(projectId, revisionId || ''),
    queryFn: () => revisionsApi.get(projectId, revisionId!),
    enabled: !!projectId && !!revisionId,
  });
}

/**
 * Create a new revision (used for drafts)
 */
export function useCreateRevision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      graphState,
      isDraft = true,
    }: {
      projectId: string;
      graphState: GraphStateDTO;
      isDraft?: boolean;
    }) => revisionsApi.create(projectId, graphState, isDraft),
    onSuccess: (response, { projectId }) => {
      // Invalidate revisions list to include new revision
      queryClient.invalidateQueries({
        queryKey: queryKeys.revisions.list(projectId),
      });
      // Add the new revision to cache
      queryClient.setQueryData(
        queryKeys.revisions.detail(projectId, response.id),
        response
      );
    },
  });
}

/**
 * Update an existing revision's graph state (for draft auto-save)
 */
export function useUpdateRevision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      revisionId,
      graphState,
    }: {
      projectId: string;
      revisionId: string;
      graphState: GraphStateDTO;
    }) => revisionsApi.update(projectId, revisionId, graphState),
    onSuccess: (response, { projectId }) => {
      // Invalidate revisions list
      queryClient.invalidateQueries({
        queryKey: queryKeys.revisions.list(projectId),
      });
      // Update the revision in cache
      queryClient.setQueryData(
        queryKeys.revisions.detail(projectId, response.id),
        response
      );
    },
  });
}

/**
 * Delete a revision
 */
export function useDeleteRevision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      revisionId,
    }: {
      projectId: string;
      revisionId: string;
    }) => revisionsApi.delete(projectId, revisionId),
    onSuccess: (_, { projectId, revisionId }) => {
      // Invalidate revisions list
      queryClient.invalidateQueries({
        queryKey: queryKeys.revisions.list(projectId),
      });
      // Remove the revision from cache
      queryClient.removeQueries({
        queryKey: queryKeys.revisions.detail(projectId, revisionId),
      });
    },
  });
}
