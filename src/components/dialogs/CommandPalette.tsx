import { useEffect } from 'react';
import { Database, Server } from 'lucide-react';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { useUIStore } from '@/stores/uiStore';
import { useGraphStore } from '@/stores/graphStore';
import { usePluginList } from '@/queries/usePlugins';

export function CommandPalette() {
  const isOpen = useUIStore((s) => s.isCommandPaletteOpen);
  const close = useUIStore((s) => s.closeCommandPalette);
  const addNode = useGraphStore((s) => s.addNode);

  // Use React Query for plugin list
  const { data: plugins = [], isLoading } = usePluginList();

  // Keyboard shortcut to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        useUIStore.getState().openCommandPalette();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectPlugin = async (pluginId: string) => {
    try {
      // Get plugin detail from cache or fetch
      const plugin = plugins.find((p) => p.id === pluginId);
      if (!plugin) return;

      // Fetch full plugin details
      const { pluginsApi } = await import('@/api/plugins');
      const pluginDetail = await pluginsApi.get(pluginId);

      // Add node near center of viewport
      addNode(pluginDetail, {
        x: 200 + Math.random() * 100,
        y: 200 + Math.random() * 100,
      });
      close();
    } catch (err) {
      console.error('Failed to load plugin details:', err);
    }
  };

  return (
    <CommandDialog
      open={isOpen}
      onOpenChange={(open) => !open && close()}
      title="Add Plugin"
      description="Search for a plugin to add to your graph"
    >
      <CommandInput placeholder="Search plugins..." />
      <CommandList>
        <CommandEmpty>
          {isLoading ? 'Loading plugins...' : 'No plugins found.'}
        </CommandEmpty>
        <CommandGroup heading="Available Plugins">
          {plugins.map((plugin) => (
            <CommandItem
              key={plugin.id}
              value={plugin.name}
              onSelect={() => handleSelectPlugin(plugin.id)}
              className="flex items-center gap-3 cursor-pointer"
            >
              {plugin.category === 'stateful' ? (
                <Database className="w-4 h-4 text-purple-500" />
              ) : (
                <Server className="w-4 h-4 text-blue-500" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{plugin.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {plugin.id}
                </p>
              </div>
              <span className="text-xs text-muted-foreground">
                {plugin.version}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
