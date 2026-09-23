import { useCallback, useSyncExternalStore } from "react";

// Session-lifetime UI state shared across screens. The prototype kept every
// screen's state in one object, so a cart or HK progress survived switching
// screens; this keeps that behaviour without prop drilling.
const values = new Map<string, unknown>();
const listeners = new Set<() => void>();

function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function useStored<T>(key: string, initial: T): [T, (next: T | ((prev: T) => T)) => void] {
  const value = useSyncExternalStore(subscribe, () => (values.has(key) ? (values.get(key) as T) : initial));
  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = values.has(key) ? (values.get(key) as T) : initial;
      values.set(key, typeof next === "function" ? (next as (p: T) => T)(prev) : next);
      listeners.forEach((fn) => fn());
    },
    // initial is only read when the key is unset; callers pass literals
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );
  return [value, set];
}

/** Set a stored value from outside a component (e.g. before navigating). */
export function setStored<T>(key: string, value: T) {
  values.set(key, value);
  listeners.forEach((fn) => fn());
}
