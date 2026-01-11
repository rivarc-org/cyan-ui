import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReactFlow, Background, Panel, type Connection } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { PluginNode } from '@/components/graph/PluginNode';
import { NodeInspector } from '@/components/graph/NodeInspector';
import { CommandPalette } from '@/components/dialogs/CommandPalette';
import { EditorLeftPanel, EditorRightPanel } from '@/components/layout/FloatingBar';
import { AddNodeMenu } from '@/components/layout/AddNodeMenu';
import { Skeleton } from '@/components/ui/skeleton';
import { EditorControls } from '@/components/graph/EditorControls';

import { useProjectController } from '@/hooks/useProjectController';
import { useGraphStore, useTemporalStore } from '@/stores/graphStore';
import { useUIStore } from '@/stores/uiStore';
import { isValidConnection } from '@/lib/validation';
import type { GraphEdge } from '@/types/graph';

// Use type assertion to avoid strict type checking with React Flow
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nodeTypes = { plugin: PluginNode } as any;

export function Editor() {
  const navigate = useNavigate();

  // ===== PROJECT CONTROLLER =====
  const {
    isLoading,
    isError,
    projectName,
    viewMode,
    revisions,
    currentRevisionId,
    activeRevisionId,
    loadRevision,
    loadLive,
    save,
    deploy,
    stop,
    deleteDraft,
    isDirty,
  } = useProjectController();

  // ===== GRAPH STORE =====
  const nodes = useGraphStore((s) => s.nodes);
  const edges = useGraphStore((s) => s.edges);
  const onNodesChange = useGraphStore((s) => s.onNodesChange);
  const onEdgesChange = useGraphStore((s) => s.onEdgesChange);
  const onConnect = useGraphStore((s) => s.onConnect);

  // ===== TEMPORAL (UNDO/REDO) =====
  const temporal = useTemporalStore();
  const handleUndo = useCallback(() => temporal.getState().undo(), [temporal]);
  const handleRedo = useCallback(() => temporal.getState().redo(), [temporal]);
  const canUndo = temporal.getState().pastStates.length > 0;
  const canRedo = temporal.getState().futureStates.length > 0;

  // ===== UI STORE =====
  const isDeploying = useUIStore((s) => s.isDeploying);
  const deploymentStatus = useUIStore((s) => s.deploymentStatus);

  // ===== CONNECTION VALIDATION =====
  const handleIsValidConnection = useCallback(
    (connection: Connection | GraphEdge) => {
      return isValidConnection(connection as Connection, nodes);
    },
    [nodes]
  );

  // ===== KEYBOARD SHORTCUTS =====
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        save();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        e.shiftKey ? handleRedo() : handleUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [save, handleUndo, handleRedo]);

  // ===== ERROR HANDLING =====
  useEffect(() => {
    if (isError) {
      navigate('/');
    }
  }, [isError, navigate]);

  // ===== LOADING STATE =====
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

  // ===== RENDER =====
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
            projectName={projectName}
            viewMode={viewMode}
            revisions={revisions}
            currentRevisionId={currentRevisionId}
            activeRevisionId={activeRevisionId}
            isDirty={isDirty}
            onBack={() => navigate('/')}
            onLoadRevision={loadRevision}
            onLoadLive={loadLive}
            onDeleteDraft={deleteDraft}
          />
        </Panel>

        <Panel position="top-right">
          <EditorRightPanel
            viewMode={viewMode}
            isDirty={isDirty}
            isSaving={deploymentStatus === 'deploying'}
            isDeploying={isDeploying}
            canUndo={canUndo}
            canRedo={canRedo}
            onSave={save}
            onDeploy={deploy}
            onStop={stop}
            onUndo={handleUndo}
            onRedo={handleRedo}
          />
        </Panel>

        <Panel position="bottom-right">
          <AddNodeMenu />
        </Panel>
      </ReactFlow>

      <NodeInspector />
      <CommandPalette />
    </div>
  );
}
