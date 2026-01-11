import { useQuery, useQueries } from '@tanstack/react-query';
import { pluginsApi } from '@/api/plugins';
import { queryKeys } from './keys';
import type { PluginDetailResponse } from '@/api/types';

/**
 * Fetch the summary list of all available plugins
 */
export function usePluginList() {
  return useQuery({
    queryKey: queryKeys.plugins.all,
    queryFn: () => pluginsApi.list(),
  });
}

/**
 * Fetch full details for a single plugin
 */
export function usePluginDetail(pluginId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.plugins.detail(pluginId),
    queryFn: () => pluginsApi.get(pluginId),
    enabled: enabled && !!pluginId,
  });
}

/**
 * Batch fetch plugin details for multiple plugins.
 * When the graph loads, we grab all unique plugin_ids and fire this.
 * Returns both the data array and a Map for easy lookup.
 */
export function usePluginDetails(pluginIds: string[]) {
  const uniqueIds = [...new Set(pluginIds)];

  return useQueries({
    queries: uniqueIds.map((id) => ({
      queryKey: queryKeys.plugins.detail(id),
      queryFn: () => pluginsApi.get(id),
      staleTime: Infinity, // Plugin definitions rarely change
    })),
    combine: (results) => {
      const isLoading = results.some((r) => r.isLoading);
      const isError = results.some((r) => r.isError);
      const data = results
        .filter((r) => r.data)
        .map((r) => r.data as PluginDetailResponse);

      // Build map for easy lookup
      const pluginMap = new Map<string, PluginDetailResponse>(
        data.map((p) => [p.id, p])
      );

      return { isLoading, isError, data, pluginMap };
    },
  });
}
