import { useCallback } from 'react';
import { useReactFlow, useViewport } from '@xyflow/react';
import { Plus, Minus, Maximize } from 'lucide-react';
import { Toolbar, ToolbarGroup, ToolbarItem, ToolbarSeparator } from '@/components/layout/EditorToolbar';

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;

export function EditorControls() {
    const { zoomIn, zoomOut, fitView } = useReactFlow();
    const { zoom } = useViewport();

    const canZoomIn = zoom < MAX_ZOOM;
    const canZoomOut = zoom > MIN_ZOOM;

    const handleZoomIn = useCallback(() => {
        zoomIn();
    }, [zoomIn]);

    const handleZoomOut = useCallback(() => {
        zoomOut();
    }, [zoomOut]);

    const handleFitView = useCallback(() => {
        fitView();
    }, [fitView]);

    return (
        <Toolbar className="flex-col">
            <ToolbarGroup className="flex-col w-8">
                <ToolbarItem
                    onClick={handleZoomIn}
                    disabled={!canZoomIn}
                    title="Zoom In"
                >
                    <Plus className="w-4 h-4" />
                </ToolbarItem>
                <ToolbarSeparator className="w-5 h-[1px] my-0.5" />
                <ToolbarItem
                    onClick={handleZoomOut}
                    disabled={!canZoomOut}
                    title="Zoom Out"
                >
                    <Minus className="w-4 h-4" />
                </ToolbarItem>
                <ToolbarSeparator className="w-5 h-[1px] my-0.5" />
                <ToolbarItem onClick={handleFitView} title="Fit View">
                    <Maximize className="w-4 h-4" />
                </ToolbarItem>
            </ToolbarGroup>
        </Toolbar>
    );
}
