import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsApi } from '@/api/projects';
import { queryKeys } from './keys';
import type { CreateProjectRequest } from '@/api/types';

/**
 * Fetch list of all projects
 */
export function useProjects() {
  return useQuery({
    queryKey: queryKeys.projects.all,
    queryFn: () => projectsApi.list(),
  });
}

/**
 * Fetch a single project by ID
 */
export function useProject(projectId: string) {
  return useQuery({
    queryKey: queryKeys.projects.detail(projectId),
    queryFn: () => projectsApi.get(projectId),
    enabled: !!projectId,
  });
}

/**
 * Create a new project
 */
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProjectRequest) => projectsApi.create(data),
    onSuccess: (response) => {
      // Invalidate the projects list to refetch
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      // Optimistically add the new project to cache
      queryClient.setQueryData(
        queryKeys.projects.detail(response.project.id),
        response.project
      );
    },
  });
}

/**
 * Delete a project
 */
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => projectsApi.delete(id),
    onSuccess: (_, id) => {
      // Invalidate the projects list
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      // Remove the deleted project from cache
      queryClient.removeQueries({ queryKey: queryKeys.projects.detail(id) });
    },
  });
}

/**
 * Deploy a project (optionally with a specific revision)
 */
export function useDeployProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      revisionId,
    }: {
      projectId: string;
      revisionId?: string;
    }) => projectsApi.deploy(projectId, revisionId),
    onSuccess: (_, { projectId }) => {
      // Refresh project to get updated current_revision_id
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(projectId),
      });
      // Refresh revisions list
      queryClient.invalidateQueries({
        queryKey: queryKeys.revisions.list(projectId),
      });
    },
  });
}

/**
 * Stop a running project
 */
export function useStopProject() {
  return useMutation({
    mutationFn: (projectId: string) => projectsApi.stop(projectId),
  });
}
