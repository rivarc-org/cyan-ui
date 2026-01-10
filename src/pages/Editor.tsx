import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ReactFlow,
  Background,
  Panel,
  type Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { PluginNode } from '@/components/graph/PluginNode';
import { NodeInspector } from '@/components/graph/NodeInspector';
import { CommandPalette } from '@/components/dialogs/CommandPalette';
import { EditorLeftPanel, EditorRightPanel } from '@/components/layout/FloatingBar';
import { AddNodeMenu } from '@/components/layout/AddNodeMenu';
import { Skeleton } from '@/components/ui/skeleton';
import { EditorControls } from '@/components/graph/EditorControls';

import { useCanvasStore, useTemporalStore } from '@/store/canvasStore';
import { useUIStore } from '@/store/uiStore';

import { useDeploymentEvents } from '@/hooks/useDeploymentEvents';

import { revisionsApi } from '@/api/revisions';
import { pluginsApi } from '@/api/plugins';
import { projectsApi } from '@/api/projects';
import { backendToFlow, flowToBackend } from '@/lib/transformers';
import { isValidConnection } from '@/lib/validation';
import type { GraphEdge } from '@/types/graph';

// Use type assertion to avoid strict type checking with React Flow
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nodeTypes = { plugin: PluginNode } as any;

export function Editor() {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Project state from store
  const currentRevisionId = useUIStore((s) => s.currentRevisionId);
  const setActiveProject = useUIStore((s) => s.setActiveProject);
  const resetProject = useUIStore((s) => s.resetProject);
  const setRevisions = useUIStore((s) => s.setRevisions);
  // loading state
  const [isLoading, setIsLoading] = useState(true);
  const [pluginMap, setPluginMap] = useState<Map<string, import('@/api/types').PluginDetailResponse>>(new Map());

  // Canvas store
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const isDirty = useCanvasStore((s) => s.isDirty);
  const onNodesChange = useCanvasStore((s) => s.onNodesChange);
  const onEdgesChange = useCanvasStore((s) => s.onEdgesChange);
  const onConnect = useCanvasStore((s) => s.onConnect);
  const setGraph = useCanvasStore((s) => s.setGraph);
  const setInitialized = useCanvasStore((s) => s.setInitialized);
  const markClean = useCanvasStore((s) => s.markClean);

  // Temporal (undo/redo)
  const temporal = useTemporalStore();

  // UI store
  const isDeploying = useUIStore((s) => s.isDeploying);
  const deploymentStatus = useUIStore((s) => s.deploymentStatus);
  const setDeploymentStatus = useUIStore((s) => s.setDeploymentStatus);
  const clearNodeStatuses = useUIStore((s) => s.clearNodeStatuses);
  const viewMode = useUIStore((s) => s.viewMode);
  const enterDraftMode = useUIStore((s) => s.enterDraftMode);
  const enterLiveMode = useUIStore((s) => s.enterLiveMode);
  const setHistoryMode = useUIStore((s) => s.setHistoryMode);

  // WebSocket for deployment events
  useDeploymentEvents(projectId || '', isDeploying);

  // Ref to track if we are currently loading to prevent double triggers
  const isInitialLoadRef = useRef(true);

  // Load project data
  useEffect(() => {
    if (!projectId) return;

    const loadData = async () => {
      setIsLoading(true);
      resetProject();
      setGraph([], []);
      markClean();

      try {
        // 1. Fetch Project, Plugins and Revisions List concurrently
        const [project, plugins, revisionList] = await Promise.all([
          projectsApi.get(projectId),
          pluginsApi.list(),
          revisionsApi.list(projectId)
        ]);

        setActiveProject(project.id, project.name, project.current_revision_id ?? null);
        setRevisions(revisionList);

        // 2. Build plugin detail map
        const pluginDetails = await Promise.all(
          plugins.map((p) => pluginsApi.get(p.id))
        );
        const map = new Map(pluginDetails.map((p) => [p.id, p]));
        setPluginMap(map);

        // 3. Determine which revision to load
        // By default, we load the project's current_revision_id.
        // If it's a draft, we are in DRAFT mode.
        // If it's NOT a draft, we are in LIVE mode.
        if (project.current_revision_id) {
          const revision = await revisionsApi.get(project.id, project.current_revision_id);
          const { nodes, edges } = backendToFlow(revision.graph_state, map);

          setGraph(nodes, edges);

          // Wait for a tick to ensure React Flow has processed the graph
          setTimeout(() => {
            setInitialized(true);
            enterLiveMode();
          }, 50);
        } else {
          // No revision yet
          setGraph([], []);
          setInitialized(true);
          enterLiveMode();
        }
      } catch (err) {
        console.error('Failed to load project:', err);
        navigate('/');
      } finally {
        setIsLoading(false);
        isInitialLoadRef.current = false;
      }
    };

    loadData();
  }, [projectId, setGraph, navigate, setActiveProject, resetProject, setRevisions, enterDraftMode, enterLiveMode, setHistoryMode, markClean, setInitialized]);

  // Auto-draft on first edit
  useEffect(() => {
    if (isDirty && viewMode !== 'draft' && projectId && !isInitialLoadRef.current) {
      enterDraftMode();
    }
  }, [isDirty, viewMode, projectId, enterDraftMode]);

  // Deploy handler
  const handleDeploy = useCallback(async () => {
    if (!projectId) return;

    try {
      setDeploymentStatus('deploying');

      // If we are in draft mode, we MUST create a new revision first
      if (viewMode === 'draft' || isDirty) {
        const graphState = flowToBackend(nodes, edges);
        await revisionsApi.create(projectId, graphState);
        // Refresh revisions list
        const newList = await revisionsApi.list(projectId);
        setRevisions(newList);
      }

      clearNodeStatuses();
      await projectsApi.deploy(projectId);

      // Transition back to live mode and mark as clean immediately after acceptance
      enterLiveMode();
      markClean();
    } catch (err) {
      console.error('Deploy failed:', err);
      setDeploymentStatus('failed');
    }
  }, [projectId, isDirty, viewMode, nodes, edges, setRevisions, enterLiveMode, markClean, clearNodeStatuses, setDeploymentStatus]);

  // Stop handler
  const handleStop = useCallback(async () => {
    if (!projectId) return;

    try {
      await projectsApi.stop(projectId);
      setDeploymentStatus('idle');
      clearNodeStatuses();
    } catch (err) {
      console.error('Stop failed:', err);
    }
  }, [projectId, setDeploymentStatus, clearNodeStatuses]);

  // Refresh metadata when deployment succeeds
  useEffect(() => {
    if (deploymentStatus === 'success' && projectId) {
      Promise.all([
        projectsApi.get(projectId),
        revisionsApi.list(projectId)
      ]).then(([project, revisionList]) => {
        setActiveProject(project.id, project.name, project.current_revision_id ?? null);
        setRevisions(revisionList);
        enterLiveMode();
      }).catch(console.error);
    }
  }, [deploymentStatus, projectId, setActiveProject, setRevisions, enterLiveMode]);

  // Load a specific revision
  const handleLoadRevision = useCallback(async (revisionId: string) => {
    if (!projectId) return;

    try {
      setInitialized(false);
      const revision = await revisionsApi.get(projectId, revisionId);
      const { nodes, edges } = backendToFlow(revision.graph_state, pluginMap);
      setGraph(nodes, edges);

      setTimeout(() => {
        setInitialized(true);
        if (revision.id === currentRevisionId) {
          enterLiveMode();
        } else {
          setHistoryMode(revision.id);
        }
      }, 50);
    } catch (err) {
      console.error('Failed to load revision:', err);
    }
  }, [projectId, pluginMap, setGraph, enterDraftMode, setHistoryMode, setInitialized]);

  // Load the current deployed revision
  const handleLoadLatest = useCallback(async () => {
    if (!projectId || !currentRevisionId) return;

    try {
      setInitialized(false);
      const revision = await revisionsApi.get(projectId, currentRevisionId);
      const { nodes, edges } = backendToFlow(revision.graph_state, pluginMap);
      setGraph(nodes, edges);

      setTimeout(() => {
        setInitialized(true);
        enterLiveMode();
      }, 50);
    } catch {
      enterLiveMode();
    }
  }, [projectId, currentRevisionId, pluginMap, setGraph, enterLiveMode, setInitialized]);

  // Connection validation
  const handleIsValidConnection = useCallback(
    (connection: Connection | GraphEdge) => {
      return isValidConnection(connection as Connection, nodes);
    },
    [nodes]
  );

  // Undo/Redo handlers
  const handleUndo = useCallback(() => {
    temporal.getState().undo();
  }, [temporal]);

  const handleRedo = useCallback(() => {
    temporal.getState().redo();
  }, [temporal]);

  const canUndo = temporal.getState().pastStates.length > 0;
  const canRedo = temporal.getState().futureStates.length > 0;

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleDeploy();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDeploy, handleUndo, handleRedo]);

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Skeleton className="h-8 w-48 mx-auto mb-4" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-background">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        isValidConnection={handleIsValidConnection}
        fitView
        proOptions={{ hideAttribution: true }}
        className="bg-background"
      >
        <Background color="var(--graph-pattern-color)" />

        <Panel position="bottom-left">
          <EditorControls />
        </Panel>

        <Panel position="top-left">
          <EditorLeftPanel
            onBack={() => navigate('/')}
            onLoadRevision={handleLoadRevision}
            onLoadLatest={handleLoadLatest}
          />
        </Panel>

        {/* Top Right - Actions & Utilities */}
        <Panel position="top-right">
          <EditorRightPanel
            isDirty={isDirty}
            isSaving={deploymentStatus === 'deploying'}
            isDeploying={isDeploying}
            canUndo={canUndo}
            canRedo={canRedo}
            onDeploy={handleDeploy}
            onStop={handleStop}
            onUndo={handleUndo}
            onRedo={handleRedo}
          />
        </Panel>

        {/* Bottom Right - Add Node Menu */}
        <Panel position="bottom-right">
          <AddNodeMenu />
        </Panel>
      </ReactFlow>

      <NodeInspector />
      <CommandPalette />
    </div>
  );
}
