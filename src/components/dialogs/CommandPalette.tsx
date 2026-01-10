import { useEffect, useState } from 'react';
import { Database, Server } from 'lucide-react';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { useUIStore } from '@/store/uiStore';
import { useCanvasStore } from '@/store/canvasStore';
import { pluginsApi } from '@/api/plugins';
import { guessDefaultImage } from '@/lib/transformers';
import type { PluginSummary } from '@/api/types';

export function CommandPalette() {
  const isOpen = useUIStore((s) => s.isCommandPaletteOpen);
  const close = useUIStore((s) => s.closeCommandPalette);
  const addNode = useCanvasStore((s) => s.addNode);

  const [plugins, setPlugins] = useState<PluginSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      pluginsApi
        .list()
        .then(setPlugins)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [isOpen]);

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
      const pluginDetail = await pluginsApi.get(pluginId);
      const defaultImage = guessDefaultImage(pluginDetail.id);

      // Add node near center of viewport
      addNode(pluginDetail, defaultImage, {
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
