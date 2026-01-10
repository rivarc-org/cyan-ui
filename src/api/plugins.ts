import { apiRequest } from './client';
import type { PluginSummary, PluginDetailResponse } from './types';

export const pluginsApi = {
  list: () => apiRequest<PluginSummary[]>('/library'),

  get: (pluginId: string) =>
    apiRequest<PluginDetailResponse>(`/library/${pluginId}`),
};
