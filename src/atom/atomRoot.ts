import { lifeCycle, PHASES } from "../globals/life-cycle";
import flagsGlobals from '../globals/flags';
import { StatusColors, AtomTypes, Atom } from "./types";

const getInitialValue = <T>(atom: Atom<T>, func: () => T | Promise<T>) => {
  flagsGlobals.clearCurrentAtom();
  const fnValue = func();
  if (fnValue instanceof Promise) {
    fnValue.then(value => {
      atom.set(value);
    });

    return undefined;
  }
  
  return fnValue;
};

export class AtomRoot<T> {
  listeners: Set<() => void>;
  children: Set<Atom<T>>;
  effects: Set<Atom<T>>;
  state: T;
  color: StatusColors;
  type: AtomTypes;
  

  constructor(initialValueOrFn: T | any) {
    this.color = 'BLACK';
    this.type = 'ROOT';
    this.state =
      typeof initialValueOrFn !== "function"
        ? initialValueOrFn
        : getInitialValue(this as unknown as Atom<T>, initialValueOrFn);
    this.children = new Set();
    this.listeners = new Set();
    this.effects = new Set();
  }

  getStatus(): StatusColors {
    return this.color;
  }

  sub(fn: () => void): () => void {
    this.listeners.add(fn);

    return () => {
      this.listeners.delete(fn);
    }
  }
  

  runListeners(): void {
    this.listeners.forEach(fn => {
      fn();
    });

    this.color = 'BLACK';
  }

  checkChildren(): void {
    const childrenList = [...this.children];
    this.children.clear();
    childrenList.forEach(atom => {
      atom.check();
    });
  }

  checkEffects(): void {
    const effectsList = [...this.effects];
    this.effects.clear();
    effectsList.forEach(atom => {
      atom.check();
    });
  }

  get(): T {
    const CURRENT_ATOM = flagsGlobals.getCurrentAtom<T>();

    if (CURRENT_ATOM !== null) {
      CURRENT_ATOM.addDeps(this as unknown as Atom<T>);

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

      const newState = newValueOrFn instanceof Function
        ? newValueOrFn(this.state)
        : newValueOrFn;

      if (this.state !== newState) {
        this.state = newState;
        this.color = 'GREEN';

        flagsGlobals.addListener<T>(this as unknown as Atom<T>);
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
