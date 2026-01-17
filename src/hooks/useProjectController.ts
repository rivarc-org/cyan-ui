import { useEffect, useMemo, useCallback, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

import { useProject, useDeployProject, useStopProject } from '@/queries/useProjects';
import {
  useRevisions,
  useRevision,
  useCreateRevision,
  useUpdateRevision,
  useDeleteRevision,
} from '@/queries/useRevisions';
import { usePluginList, usePluginDetails } from '@/queries/usePlugins';
import { useGraphStore } from '@/stores/graphStore';
import { useUIStore } from '@/stores/uiStore';
import { useDeploymentEvents } from './useDeploymentEvents';
import { queryKeys } from '@/queries/keys';
import type { RevisionSummary, PluginDetailResponse } from '@/api/types';

export type ViewMode = 'live' | 'draft' | 'history';

interface ProjectControllerResult {
  // Loading states
  isLoading: boolean;
  isError: boolean;
  error: Error | null;

  // Project data
  projectId: string | undefined;
  projectName: string | undefined;
  currentRevisionId: string | null;

  // View mode
  viewMode: ViewMode;
  activeRevisionId: string | null;
  revisions: RevisionSummary[];

  // Plugin data
  pluginMap: Map<string, PluginDetailResponse>;

  // Actions
  loadRevision: (revisionId: string) => void;
  loadLive: () => void;
  save: () => Promise<string | null>;
  deploy: () => Promise<void>;
  stop: () => Promise<void>;
  deleteDraft: (revisionId: string) => Promise<void>;

  // Graph access
  isDirty: boolean;
  markClean: () => void;
}

// Debounce delay for auto-save (ms)
const AUTO_SAVE_DELAY = 2000;

export function useProjectController(): ProjectControllerResult {
  const { id: projectId } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const queryClient = useQueryClient();

  // URL-derived state
  const revisionIdFromUrl = searchParams.get('revision');

  // Refs to prevent double-loading
  const loadedRevisionRef = useRef<string | null>(null);
  const isInitialLoadRef = useRef(true);

  // Draft tracking state
  const [draftRevisionId, setDraftRevisionId] = useState<string | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ===== QUERIES =====

  // Project data
  const {
    data: project,
    isLoading: projectLoading,
    isError: projectError,
    error: projectErrorData,
  } = useProject(projectId || '');

  // Revisions list
  const { data: revisions = [], isLoading: revisionsLoading } = useRevisions(
    projectId || ''
  );

  // Plugin list (for getting all plugin IDs)
  const { data: pluginList = [] } = usePluginList();

  // Batch fetch all plugin details
  const { pluginMap, isLoading: pluginsLoading } = usePluginDetails(
    pluginList.map((p) => p.id)
  );

  // ===== DERIVED STATE =====

  const currentRevisionId = project?.current_revision_id ?? null;

  // Determine which revision to load based on URL and project state
  const targetRevisionId = useMemo(() => {
    // If we have a draft in progress, use that
    if (draftRevisionId) {
      return draftRevisionId;
    }
    // If URL has a revision, use it
    if (revisionIdFromUrl) {
      return revisionIdFromUrl;
    }
    // Otherwise, use the current (live) revision
    return currentRevisionId;
  }, [revisionIdFromUrl, currentRevisionId, draftRevisionId]);

  // Fetch the target revision
  const { data: activeRevision, isLoading: revisionLoading } = useRevision(
    projectId || '',
    targetRevisionId
  );

  // ===== GRAPH STORE =====

  const isDirty = useGraphStore((s) => s.isDirty);
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const loadCanvas = useGraphStore((s) => s.loadCanvas);
  const getGraphState = useGraphStore((s) => s.getGraphState);
  const markClean = useGraphStore((s) => s.markClean);

  // ===== UI STORE =====

  const isDeploying = useUIStore((s) => s.isDeploying);
  const setDeploymentStatus = useUIStore((s) => s.setDeploymentStatus);
  const clearNodeStatuses = useUIStore((s) => s.clearNodeStatuses);

  // ===== MUTATIONS =====

  const createRevisionMutation = useCreateRevision();
  const updateRevisionMutation = useUpdateRevision();
  const deleteRevisionMutation = useDeleteRevision();
  const deployMutation = useDeployProject();
  const stopMutation = useStopProject();

  // ===== WEBSOCKET =====

  useDeploymentEvents(projectId || '', isDeploying);

  // ===== COMPUTED VIEW MODE =====

  // Check if the currently viewed revision is a draft
  const activeRevisionIsDraft = useMemo(() => {
    if (!revisionIdFromUrl) return false;
    const rev = revisions.find((r) => r.id === revisionIdFromUrl);
    return rev?.is_draft ?? false;
  }, [revisionIdFromUrl, revisions]);

  const viewMode = useMemo((): ViewMode => {
    // If we have unsaved local changes, we're in draft mode
    if (isDirty) {
      return 'draft';
    }

    // If viewing a draft revision (from URL), we're in draft mode
    if (activeRevisionIsDraft) {
      return 'draft';
    }

    // If no revision in URL or it matches current, we're live
    if (!revisionIdFromUrl || revisionIdFromUrl === currentRevisionId) {
      return 'live';
    }

    // Otherwise we're viewing history
    return 'history';
  }, [revisionIdFromUrl, currentRevisionId, isDirty, activeRevisionIsDraft]);

  // ===== EFFECTS =====

  // Load revision into graph store when data is ready
  useEffect(() => {
    if (!activeRevision || pluginsLoading || !pluginMap.size) {
      return;
    }

    // Prevent re-loading the same revision
    if (loadedRevisionRef.current === activeRevision.id) {
      return;
    }

    loadCanvas(activeRevision.graph_state, pluginMap);
    loadedRevisionRef.current = activeRevision.id;
    isInitialLoadRef.current = false;
  }, [activeRevision, pluginMap, pluginsLoading, loadCanvas]);

  // Auto-save draft when dirty
  useEffect(() => {
    // Don't auto-save during initial load or if not dirty
    if (isInitialLoadRef.current || !isDirty || !projectId) {
      return;
    }

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Set new timer for debounced save
    autoSaveTimerRef.current = setTimeout(async () => {
      const graphState = getGraphState();

      try {
        // Check if we're already viewing a draft (from URL or local state)
        const existingDraftId = activeRevisionIsDraft ? revisionIdFromUrl : draftRevisionId;

        if (!existingDraftId) {
          // Create new draft revision
          const draft = await createRevisionMutation.mutateAsync({
            projectId,
            graphState,
          });
          setDraftRevisionId(draft.id);
          setSearchParams({ revision: draft.id }, { replace: true });
        } else {
          // Update existing draft
          await updateRevisionMutation.mutateAsync({
            projectId,
            revisionId: existingDraftId,
            graphState,
          });
          // Ensure URL param is still set (in case it was lost)
          if (searchParams.get('revision') !== existingDraftId) {
            setSearchParams({ revision: existingDraftId }, { replace: true });
          }
          // Ensure local draft state is set (for URL-loaded drafts)
          if (!draftRevisionId) {
            setDraftRevisionId(existingDraftId);
          }
        }
        markClean();
      } catch (err) {
        console.error('Auto-save failed:', err);
      }
    }, AUTO_SAVE_DELAY);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [
    isDirty,
    nodes,
    edges,
    projectId,
    draftRevisionId,
    activeRevisionIsDraft,
    revisionIdFromUrl,
    searchParams,
    getGraphState,
    createRevisionMutation,
    updateRevisionMutation,
    setSearchParams,
    markClean,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  // ===== ACTIONS =====

  const loadRevision = useCallback(
    (revisionId: string) => {
      // Clear draft state when loading a different revision
      setDraftRevisionId(null);
      loadedRevisionRef.current = null; // Force reload
      setSearchParams({ revision: revisionId });
    },
    [setSearchParams]
  );

  const loadLive = useCallback(() => {
    // Clear draft state when switching to live
    setDraftRevisionId(null);
    loadedRevisionRef.current = null; // Force reload
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const save = useCallback(async () => {
    if (!projectId) return null;

    const graphState = getGraphState();
    let savedRevisionId: string | null = null;

    try {
      // Check if we're already viewing a draft (from URL or local state)
      const existingDraftId = activeRevisionIsDraft
        ? revisionIdFromUrl
        : draftRevisionId;

      if (!existingDraftId) {
        // Create new draft revision
        const draft = await createRevisionMutation.mutateAsync({
          projectId,
          graphState,
        });
        savedRevisionId = draft.id;
        setDraftRevisionId(draft.id);
        setSearchParams({ revision: draft.id }, { replace: true });
      } else {
        // Update existing draft
        await updateRevisionMutation.mutateAsync({
          projectId,
          revisionId: existingDraftId,
          graphState,
        });
        savedRevisionId = existingDraftId;
        // Ensure URL param is still set (in case it was lost)
        if (searchParams.get('revision') !== existingDraftId) {
          setSearchParams({ revision: existingDraftId }, { replace: true });
        }
        // Ensure local draft state is set (for URL-loaded drafts)
        if (!draftRevisionId) {
          setDraftRevisionId(existingDraftId);
        }
      }
      markClean();

      // Refresh data
      queryClient.invalidateQueries({
        queryKey: queryKeys.revisions.list(projectId),
      });

      return savedRevisionId;
    } catch (err) {
      console.error('Save failed:', err);
      throw err;
    }
  }, [
    projectId,
    getGraphState,
    activeRevisionIsDraft,
    revisionIdFromUrl,
    draftRevisionId,
    createRevisionMutation,
    updateRevisionMutation,
    setSearchParams,
    searchParams,
    markClean,
    queryClient,
  ]);

  const deploy = useCallback(async () => {
    if (!projectId) return;

    try {
      setDeploymentStatus('deploying');
      clearNodeStatuses();

      // Determine if we have an existing draft to update
      const existingDraftId = activeRevisionIsDraft
        ? revisionIdFromUrl
        : draftRevisionId;
      let revisionToDeploy = existingDraftId;

      // If we have unsaved changes, save them first
      if (isDirty) {
        revisionToDeploy = await save();
      }

      const revisionID = revisionToDeploy || currentRevisionId;
      if (!revisionID) {
        throw new Error('No revision ID found to deploy');
      }

      // Deploy the draft (or current revision if no draft)
      await deployMutation.mutateAsync({
        projectId,
        revisionId: revisionID,
      });

      // Refresh data
      queryClient.invalidateQueries({
        queryKey: queryKeys.projects.detail(projectId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.revisions.list(projectId),
      });

      // Clear draft state and return to live mode
      setDraftRevisionId(null);
      markClean();
      loadedRevisionRef.current = null;
      setSearchParams({}, { replace: true });
    } catch (err) {
      console.error('Deploy failed:', err);
      setDeploymentStatus('failed');
    }
  }, [
    projectId,
    isDirty,
    save,
    activeRevisionIsDraft,
    revisionIdFromUrl,
    draftRevisionId,
    deployMutation,
    currentRevisionId,
    queryClient,
    markClean,
    setSearchParams,
    setDeploymentStatus,
    clearNodeStatuses,
  ]);

  const stop = useCallback(async () => {
    if (!projectId) return;

    try {
      await stopMutation.mutateAsync(projectId);
      setDeploymentStatus('idle');
      clearNodeStatuses();
    } catch (err) {
      console.error('Stop failed:', err);
    }
  }, [projectId, stopMutation, setDeploymentStatus, clearNodeStatuses]);

  const deleteDraft = useCallback(async (revisionId: string) => {
    if (!projectId) return;

    try {
      await deleteRevisionMutation.mutateAsync({ projectId, revisionId });

      // If we're currently viewing the deleted draft, switch to live
      if (revisionIdFromUrl === revisionId || draftRevisionId === revisionId) {
        setDraftRevisionId(null);
        loadedRevisionRef.current = null;
        setSearchParams({}, { replace: true });
      }
    } catch (err) {
      console.error('Delete draft failed:', err);
    }
  }, [projectId, deleteRevisionMutation, revisionIdFromUrl, draftRevisionId, setSearchParams]);

  // ===== RETURN =====

  const isLoading =
    projectLoading || revisionsLoading || pluginsLoading || revisionLoading;
  const isError = projectError;
  const error = projectErrorData as Error | null;

  return {
    isLoading,
    isError,
    error,
    projectId,
    projectName: project?.name,
    currentRevisionId,
    viewMode,
    activeRevisionId: targetRevisionId,
    revisions,
    pluginMap,
    loadRevision,
    loadLive,
    save,
    deploy,
    stop,
    deleteDraft,
    isDirty,
    markClean,
  };
}
