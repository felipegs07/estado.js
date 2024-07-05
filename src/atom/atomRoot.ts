import { lifeCycle, PHASES } from "../globals/life-cycle";
import flagsGlobals from '../globals/flags';
import { StatusColors, AtomTypes, AtomRootType } from "./types";


const getInitialValue = <T>(atom: Atom, func: () => T) => {
  flagsGlobals.addCurrentAtom(atom);
  const value = func();
  flagsGlobals.clearCurrentAtom();

  return value;
};

export class AtomRoot<T> {
  listeners: Set<() => void>;
  children: Set<Atom>;
  state: T;
  color: StatusColors;
  type: AtomTypes;
  

  constructor(initialValueOrFn: T | any) {
    this.color = 'BLACK';
    this.type = 'ROOT';
    this.state =
      typeof initialValueOrFn !== "function"
        ? initialValueOrFn
        : getInitialValue(this, initialValueOrFn);
    this.children = new Set();
    this.listeners = new Set();
  }

  getStatus():StatusColors {
    return this.color;
  }

  sub(fn: () => void): () => void {
    this.listeners.add(fn);

    return () => {
      this.listeners.delete(fn);
    }
  }
  

  runListeners():void {
    this.listeners.forEach(fn => {
      fn();
    });
  }

  checkChildren():void {
    const childrenList = [...this.children];
    this.children.clear();
    childrenList.forEach(atom => {
      atom.check();
    });
  }

  get(): T {
    const CURRENT_ATOM = flagsGlobals.getCurrentAtom();

    if (CURRENT_ATOM !== null) {
      this.children.add(CURRENT_ATOM);
      CURRENT_ATOM.addDeps(this);
    }

    return this.state;
  }

  set(newValueOrFn: T | any): void {
    const currentPhase = lifeCycle.getPhase();
    const isBatching = flagsGlobals.getIsBatch();
    if (currentPhase === PHASES.waiting || isBatching) {
      lifeCycle.startChecking();

      const newState = typeof newValueOrFn !== "function"
        ? newValueOrFn
        : newValueOrFn(this.state);

      if (this.state !== newState) {
        this.state = newState;
        this.color = 'GREEN';

        flagsGlobals.addListener(this);
        this.checkChildren();

        if (!isBatching) {
          lifeCycle.startDeriving();
          lifeCycle.startNotifying();
        }
      }
    }
  }
}
