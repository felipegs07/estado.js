import { StatusColors, AtomTypes, Atom } from "./types";
import flagsGlobals from '../globals/flags';


const calculateStateValue = <T>(atom: Atom, func: () => T) => {
  flagsGlobals.addCurrentAtom(atom);
  const value = func();
  flagsGlobals.clearCurrentAtom();

  return value;
};

export class AtomDerived<T> {
  private listeners: Set<() => void>;
  private children: Set<Atom>;
  private dependencies: Set<Atom>;
  private state: T;
  private color: StatusColors;
  private type: AtomTypes;
  private computationFn: () => T;

  constructor(fn: () => T) {
    this.dependencies = new Set();
    this.color = 'BLACK';
    this.computationFn = fn;
    this.state = calculateStateValue(this, fn);
    this.children = new Set();
    this.listeners = new Set();
    this.type = this.dependencies.size > 1 ? 'MULTI' : 'SIMPLE';
  }

  addDeps(dep: Atom):void {
    this.dependencies.add(dep);
  }

  sub(fn: () => void): void {
    this.listeners.add(fn);
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

  getStatus():StatusColors {
    return this.color;
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

  recalculateState():boolean {
    this.dependencies.clear();
    const newState = calculateStateValue(this, this.computationFn);
    this.type = this.dependencies.size > 1 ? 'MULTI' : 'SIMPLE';

    if (newState !== this.state) {
      this.state = newState;
      this.color = 'GREEN';
      flagsGlobals.addListener(this);
      
      return true;
    }

    this.color = 'BLACK';
    return false;
  }

  check():void {
    if (this.type === 'SIMPLE'){
      const hasUpdate = this.recalculateState();

      if (hasUpdate) {
        this.checkChildren();
      }
    } else {
      this.color = 'RED';
      flagsGlobals.addAtomDerive(this);
      this.checkChildren();
    }
  }

  sync():void {
    this.dependencies.forEach(dep => {
      const status = dep.getStatus();
      if (status === 'RED') {
        dep.sync();
      }
    });

    this.recalculateState();
  }
}
