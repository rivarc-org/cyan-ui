import { useCallback } from 'react';
import { toast } from 'sonner';
import { useWebSocket } from './useWebSocket';
import { useUIStore } from '@/stores/uiStore';
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
          toast.info('Deployment started');
          break;

        case 'node_starting':
        case 'node_health_check':
        case 'node_ready':
        case 'node_failed': {
          const nodeData = data.data as NodeProgressData | undefined;
          if (nodeData?.node_id) {
            updateNodeStatus(nodeData.node_id, mapPhaseToStatus(nodeData.phase));
            toast.info(`${nodeData.node_id}: ${nodeData.phase}`, {
              description: nodeData.message,
            });
          }
          break;
        }

        case 'deploy_completed': {
          const resultData = data.data as DeployResultData | undefined;
          setDeploymentStatus(resultData?.success ? 'success' : 'failed');
          if (resultData?.success) {
            toast.info('Deployment completed successfully');
          } else {
            toast.info('Deployment completed with errors', {
              description: resultData?.error,
            });
          }
          break;
        }

        case 'deploy_failed':
          setDeploymentStatus('failed');
          toast.info('Deployment failed');
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
