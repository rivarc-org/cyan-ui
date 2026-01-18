import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { GraphError } from '@/lib/validateGraph';

interface ValidationState {
  errorsByNode: Map<string, GraphError[]>;
  allErrors: GraphError[];
  hasErrors: boolean;
  setErrors: (errors: GraphError[]) => void;
  clearErrors: () => void;
}

export const useValidationStore = create<ValidationState>()(
  subscribeWithSelector((set) => ({
    errorsByNode: new Map(),
    allErrors: [],
    hasErrors: false,

    setErrors: (errors) => {
      // Index errors by nodeId for efficient per-node lookups
      const errorsByNode = new Map<string, GraphError[]>();
      for (const error of errors) {
        const existing = errorsByNode.get(error.nodeId) || [];
        existing.push(error);
        errorsByNode.set(error.nodeId, existing);
      }

      set({
        errorsByNode,
        allErrors: errors,
        hasErrors: errors.length > 0,
      });
    },

    clearErrors: () =>
      set({
        errorsByNode: new Map(),
        allErrors: [],
        hasErrors: false,
      }),
  }))
);
