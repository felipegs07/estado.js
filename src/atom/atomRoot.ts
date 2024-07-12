import { lifeCycle, PHASES } from "../globals/life-cycle";
import flagsGlobals from '../globals/flags';
import { StatusColors, AtomTypes, AtomRootType } from "./types";


const getInitialValue = <T>(atom: Atom, func: () => T | (() => Promise<T>)) => {
  flagsGlobals.clearCurrentAtom();
  if (func?.constructor?.name == 'AsyncFunction') {
    func()?.then(value => {
      atom.set(value as T);
    });
    return undefined;
  }
  
  const value = func();
  return value;
};

export class AtomRoot<T> {
  listeners: Set<() => void>;
  children: Set<Atom>;
  effects: Set<Atom>;
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
    this.effects = new Set();
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

  checkEffects():void {
    const effectsList = [...this.effects];
    this.effects.clear();
    effectsList.forEach(atom => {
      atom.check();
    });
  }

  get(): T {
    const CURRENT_ATOM = flagsGlobals.getCurrentAtom();

    if (CURRENT_ATOM !== null) {
      CURRENT_ATOM.addDeps(this);

      if (CURRENT_ATOM?.type === 'EFFECT') {
        this.effects.add(CURRENT_ATOM);
      } else {
        this.children.add(CURRENT_ATOM);
      }
    }

    return this.state;
  }

  set(newValueOrFn: T | ((oldState: T) => T)): void {
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
        this.checkEffects();
        this.checkChildren();

        if (!isBatching) {
          lifeCycle.startDeriving();
          lifeCycle.startNotifying();
        }
      } else {
        lifeCycle.startWaiting();
      }
    }
  }
}
