import { useCallback, useState } from 'react';
import type { Edge, Node } from '@xyflow/react';

export interface FlowHistoryState {
  nodes: Node[];
  edges: Edge[];
}

function cloneHistoryState(state: FlowHistoryState): FlowHistoryState {
  return JSON.parse(JSON.stringify(state)) as FlowHistoryState;
}

function isSameState(left: FlowHistoryState | undefined, right: FlowHistoryState) {
  if (!left) {
    return false;
  }
  return JSON.stringify(left) === JSON.stringify(right);
}

export function useUndoRedo(maxHistory = 50) {
  const [past, setPast] = useState<FlowHistoryState[]>([]);
  const [future, setFuture] = useState<FlowHistoryState[]>([]);

  const pushState = useCallback((state: FlowHistoryState) => {
    const snapshot = cloneHistoryState(state);
    setPast((prev) => {
      const last = prev[prev.length - 1];
      if (isSameState(last, snapshot)) {
        return prev;
      }
      return [...prev.slice(-maxHistory + 1), snapshot];
    });
    setFuture([]);
  }, [maxHistory]);

  const undo = useCallback((currentState: FlowHistoryState) => {
    if (past.length === 0) {
      return null;
    }
    const previous = past[past.length - 1];
    setPast((prev) => prev.slice(0, -1));
    setFuture((prev) => [cloneHistoryState(currentState), ...prev]);
    return cloneHistoryState(previous);
  }, [past]);

  const redo = useCallback((currentState: FlowHistoryState) => {
    if (future.length === 0) {
      return null;
    }
    const next = future[0];
    setFuture((prev) => prev.slice(1));
    setPast((prev) => [...prev.slice(-maxHistory + 1), cloneHistoryState(currentState)]);
    return cloneHistoryState(next);
  }, [future, maxHistory]);

  const clearHistory = useCallback(() => {
    setPast([]);
    setFuture([]);
  }, []);

  return {
    pushState,
    undo,
    redo,
    clearHistory,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  };
}
