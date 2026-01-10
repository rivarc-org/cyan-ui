import { useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import { useUIStore } from '@/store/uiStore';
import type {
  DeploymentEvent,
  NodeProgressData,
  DeployResultData,
} from '@/api/types';
import type { NodeStatus } from '@/types/graph';

// Map phase strings from backend to our NodeStatus type
function mapPhaseToStatus(phase: string): NodeStatus {
  const phaseMap: Record<string, NodeStatus> = {
    pulling: 'pulling',
    starting: 'starting',
    running: 'running',
    healthy: 'healthy',
    unhealthy: 'unhealthy',
    failed: 'failed',
  };
  return phaseMap[phase.toLowerCase()] || 'pending';
}

export function useDeploymentEvents(projectId: string, enabled: boolean) {
  const updateNodeStatus = useUIStore((s) => s.updateNodeStatus);
  const setDeploymentStatus = useUIStore((s) => s.setDeploymentStatus);

  const handleMessage = useCallback(
    (data: DeploymentEvent) => {
      switch (data.type) {
        case 'deploy_started':
          setDeploymentStatus('deploying');
          break;

        case 'node_starting':
        case 'node_health_check':
        case 'node_ready':
        case 'node_failed': {
          const nodeData = data.data as NodeProgressData | undefined;
          if (nodeData?.node_id) {
            updateNodeStatus(nodeData.node_id, mapPhaseToStatus(nodeData.phase));
          }
          break;
        }

        case 'deploy_completed': {
          const resultData = data.data as DeployResultData | undefined;
          setDeploymentStatus(resultData?.success ? 'success' : 'failed');
          break;
        }

        case 'deploy_failed':
          setDeploymentStatus('failed');
          break;
      }
    },
    [updateNodeStatus, setDeploymentStatus]
  );

  return useWebSocket<DeploymentEvent>({
    url: `/api/v1/projects/${projectId}/events`,
    onMessage: handleMessage,
    enabled,
  });
}
