import { useState } from 'react';

export function useHistory(initialState) {
  const [past, setPast] = useState([]);
  const [present, setPresent] = useState(initialState);
  const [future, setFuture] = useState([]);

  const update = (nextValue) => {
    setPast((current) => [...current, present]);
    setPresent(nextValue);
    setFuture([]);
  };

  const undo = () => {
    if (!past.length) return;
    const previous = past[past.length - 1];
    setPast((current) => current.slice(0, -1));
    setFuture((current) => [present, ...current]);
    setPresent(previous);
  };

  const redo = () => {
    if (!future.length) return;
    const next = future[0];
    setFuture((current) => current.slice(1));
    setPast((current) => [...current, present]);
    setPresent(next);
  };

  const reset = (value) => {
    setPast([]);
    setFuture([]);
    setPresent(value);
  };

  return {
    state: present,
    setState: update,
    reset,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  };
}
