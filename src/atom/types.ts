// really generic type, TODO: fix it with specific types
export type Atom<T> = {
  type: AtomTypes;
  addDeps: (dep: Atom<T>) => void;
  runListeners: () => void;
  check: () => void;
  sync: () => boolean;
  getStatus: () => StatusColors;
  sub: (fn: () => void) => () => void;
  checkChildren: () => void;
  checkEffects: () => void;
  get: () => T;
  set: (newValueOrFn: T | ((oldState: T) => T)) => void;
  asyncUpdate: (newState: T) => void;
  updateState: (newState: T | undefined) => boolean;
  recalculateState: () => void;
  getPureState: () => T;
  verifyIsActiveAtom: () => boolean;
};

export type Setter<T> = (oldState: T) => T;
export type StatusColors = 'WHITE' | 'GREEN' | 'YELLOW' | 'RED';
export type DerivedTypes = 'SINGLE' | 'MULTI'
export type AtomTypes =  'ROOT' | 'EFFECT' | DerivedTypes;
export type Flags = {
  CURRENT_ATOM: Atom<unknown> | null;
  COMPUTED_RUN: boolean;
};