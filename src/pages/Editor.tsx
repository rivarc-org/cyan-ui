import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ReactFlow,
  Background,
  Controls,
  Panel,
  type Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Plus } from 'lucide-react';

import { PluginNode } from '@/components/graph/PluginNode';
import { NodeInspector } from '@/components/graph/NodeInspector';
import { CommandPalette } from '@/components/dialogs/CommandPalette';
import { FloatingBar } from '@/components/layout/FloatingBar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

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

  const [projectName, setProjectName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Canvas store
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const isDirty = useCanvasStore((s) => s.isDirty);
  const onNodesChange = useCanvasStore((s) => s.onNodesChange);
  const onEdgesChange = useCanvasStore((s) => s.onEdgesChange);
  const onConnect = useCanvasStore((s) => s.onConnect);
  const setGraph = useCanvasStore((s) => s.setGraph);
  const markClean = useCanvasStore((s) => s.markClean);

  // Temporal (undo/redo)
  const temporal = useTemporalStore();

  // UI store
  const isDeploying = useUIStore((s) => s.isDeploying);
  const setDeploymentStatus = useUIStore((s) => s.setDeploymentStatus);
  const clearNodeStatuses = useUIStore((s) => s.clearNodeStatuses);
  const openCommandPalette = useUIStore((s) => s.openCommandPalette);

  // WebSocket for deployment events
  useDeploymentEvents(projectId || '', isDeploying);

  // Load project data
  useEffect(() => {
    if (!projectId) return;

    const loadData = async () => {
      try {
        // Load project and plugins first
        const [project, plugins] = await Promise.all([
          projectsApi.get(projectId),
          pluginsApi.list(),
        ]);

        setProjectName(project.name);

        // Build plugin detail map
        const pluginDetails = await Promise.all(
          plugins.map((p) => pluginsApi.get(p.id))
        );
        const map = new Map(pluginDetails.map((p) => [p.id, p]));

        // Load latest revision
        try {
          const revision = await revisionsApi.getLatest(projectId);
          const { nodes, edges } = backendToFlow(revision.graph_state, map);
          setGraph(nodes, edges);
        } catch {
          // No revision yet, start with empty graph
          setGraph([], []);
        }
      } catch (err) {
        console.error('Failed to load project:', err);
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [projectId, setGraph, navigate]);

  // Save handler
  const handleSave = useCallback(async () => {
    if (!projectId || isSaving) return;

    setIsSaving(true);
    try {
      const graphState = flowToBackend(nodes, edges);
      await revisionsApi.create(projectId, graphState);
      markClean();
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setIsSaving(false);
    }
  }, [projectId, nodes, edges, isSaving, markClean]);

  // Deploy handler
  const handleDeploy = useCallback(async () => {
    if (!projectId) return;

    // Save first if dirty
    if (isDirty) {
      await handleSave();
    }

    try {
      clearNodeStatuses();
      setDeploymentStatus('deploying');
      await projectsApi.deploy(projectId);
      // Status updates come via WebSocket
    } catch (err) {
      console.error('Deploy failed:', err);
      setDeploymentStatus('failed');
    }
  }, [projectId, isDirty, handleSave, clearNodeStatuses, setDeploymentStatus]);

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

  // Connection validation
  const handleIsValidConnection = useCallback(
    (connection: Connection | GraphEdge) => {
      // Cast to Connection for validation
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
        handleSave();
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
  }, [handleSave, handleUndo, handleRedo]);

  if (isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Skeleton className="h-8 w-48 mx-auto mb-4" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen">
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
        className="bg-gray-50"
      >
        <Background />
        <Controls />

        {/* Top Left - Floating Bar */}
        <Panel position="top-left">
          <FloatingBar
            projectName={projectName}
            isDirty={isDirty}
            isSaving={isSaving}
            isDeploying={isDeploying}
            canUndo={canUndo}
            canRedo={canRedo}
            onBack={() => navigate('/')}
            onSave={handleSave}
            onDeploy={handleDeploy}
            onStop={handleStop}
            onUndo={handleUndo}
            onRedo={handleRedo}
          />
        </Panel>

        {/* Bottom Center - Add Node Button */}
        <Panel position="bottom-center">
          <Button
            onClick={openCommandPalette}
            className="rounded-full w-12 h-12 shadow-lg"
            title="Add plugin (Cmd+K)"
          >
            <Plus className="w-5 h-5" />
          </Button>
        </Panel>
      </ReactFlow>

      <NodeInspector />
      <CommandPalette />
    </div>
  );
}
