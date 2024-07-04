import { lifeCycle, PHASES } from "../globals/life-cycle";
import flagsGlobals from '../globals/flags';
import { StatusColors, AtomTypes, Atom } from "./types";


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

    if (CURRENT_ATOM !== null && CURRENT_ATOM.type === 'EFFECT') {
      if (CURRENT_ATOM?.executeEffect){
        this.listeners.add(CURRENT_ATOM.executeEffect);
      }
    } else if (CURRENT_ATOM !== null) {
      this.children.add(CURRENT_ATOM);
      CURRENT_ATOM.addDeps(this);
    }

    return this.state;
  }

  set(newValueOrFn: T | any): void {
    const currentPhase = lifeCycle.getPhase();
    if (currentPhase === PHASES.waiting) {
      lifeCycle.startChecking();
      this.state =
      typeof newValueOrFn !== "function"
        ? newValueOrFn
        : newValueOrFn(this.state);

      flagsGlobals.addListener(this);
      this.checkChildren();

      lifeCycle.startDeriving();
      lifeCycle.startNotifying();
    }
  }
}
