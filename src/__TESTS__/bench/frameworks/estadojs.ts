import { batchUpdates, derived, effect, state } from "../../../index";
import { ReactiveFramework, Signal, Computed } from "../util/ReactiveFramework";

function wrapSignal<T>(initialValue: T): Signal<T> {
  const r = state(initialValue);
  return {
    write: r.set,
    read: r.get,
    debug: r.debug
  };
}

function wrapComputed<T>(fn: () => T): Computed<T> {
  const r = derived(fn);
  return {
    read: r.get,
    debug: r.debug
  };
}

export const estadojsFramework: ReactiveFramework = {
  name: "@estadojs",
  signal: wrapSignal,
  computed: wrapComputed,
  effect: (fn) => effect(fn),
  withBatch: (fn) => batchUpdates(fn),
  withBuild: (fn) => fn(),
  run: () => {},
};
