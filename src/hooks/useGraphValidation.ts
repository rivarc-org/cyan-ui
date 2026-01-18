import { useEffect, useRef } from 'react';
import { useGraphStore } from '@/stores/graphStore';
import { useValidationStore } from '@/stores/validationStore';
import { checkNodeTypes } from '@/lib/validateGraph';

const DEBOUNCE_MS = 150;

/**
 * Hook that subscribes to graph changes and runs validation.
 * Debounces validation to avoid excessive computation during rapid changes.
 */
export function useGraphValidation() {
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const runValidation = () => {
      const { nodes, edges } = useGraphStore.getState();
      console.log('[Validation] Running with', nodes.length, 'nodes and', edges.length, 'edges');
      console.log('[Validation] Edges:', edges.map(e => ({ id: e.id, target: e.target, targetHandle: e.targetHandle })));
      const errors = checkNodeTypes(nodes, edges);
      console.log('[Validation] Errors:', errors);
      useValidationStore.getState().setErrors(errors);
    };

    // Run initial validation
    runValidation();

    // Subscribe to all graph store changes and debounce validation
    const unsubscribe = useGraphStore.subscribe(() => {
      // Clear existing timeout
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }

      // Schedule debounced validation
      timeoutRef.current = window.setTimeout(() => {
        runValidation();
        timeoutRef.current = null;
      }, DEBOUNCE_MS);
    });

    return () => {
      unsubscribe();
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);
}
