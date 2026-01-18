import { useLayoutEffect, useRef } from 'react';
import { GRID_SIZE } from './constants';

/**
 * Hook to handle grid-snapped height for nodes using ResizeObserver.
 * Monitors content height changes and snaps the node height to the nearest grid unit.
 */
export function useNodeResize() {
  const nodeRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!contentRef.current || !nodeRef.current) return;

    const observer = new ResizeObserver(() => {
      if (contentRef.current && nodeRef.current) {
        const contentHeight = contentRef.current.offsetHeight;
        // Add border width (2px top + 2px bottom = 4px)
        const totalHeight = contentHeight + 4;
        const snappedHeight = Math.ceil(totalHeight / GRID_SIZE) * GRID_SIZE;

        // Only update if changed to avoid loops
        if (nodeRef.current.style.height !== `${snappedHeight}px`) {
          nodeRef.current.style.height = `${snappedHeight}px`;
        }
      }
    });

    observer.observe(contentRef.current);

    return () => observer.disconnect();
  }, []);

  return { nodeRef, contentRef };
}
