import { StatusColors, AtomTypes, Atom, DerivedTypes } from "./types";
import flagsGlobals from '../globals/flags';
import { lifeCycle, PHASES } from "../globals/life-cycle";


const calculateStateValue = <T>(atom: Atom, func: () => T) => {
  flagsGlobals.addCurrentAtom(atom);
   if (func?.constructor?.name == 'AsyncFunction') {
    func()?.then(value => {
      atom.asyncUpdate(value as T);
    });

    flagsGlobals.clearCurrentAtom();
    return undefined;
  }

  const value = func();
  flagsGlobals.clearCurrentAtom();

  return value;
};

export class AtomDerived<T> {
  private listeners: Set<() => void>;
  private children: Set<Atom>;
  private dependencies: Set<Atom>;
  private effects: Set<Atom>;
  private state: T | undefined;
  private color: StatusColors;
  private type: DerivedTypes;
  private computationFn: () => T;

  constructor(fn: () => T) {
    this.dependencies = new Set();
    this.color = 'BLACK';
    this.computationFn = fn;
    this.state = calculateStateValue(this, fn);
    this.children = new Set();
    this.listeners = new Set();
    this.type = this.defineDerivedType();
    this.effects = new Set();
  }

  private defineDerivedType(): DerivedTypes {
    if( this.dependencies.size > 1) return 'MULTI';

    const it = this.dependencies.values();
    const first = it.next();
    const dependency = first.value;

    return dependency.type === 'MULTI' ? 'MULTI' : 'SIMPLE';
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

    this.color = 'BLACK';
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

  getStatus():StatusColors {
    return this.color;
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

    return this.state as T;
  }

  asyncUpdate(newState: T): void {
    const currentPhase = lifeCycle.getPhase();
    const isBatching = flagsGlobals.getIsBatch();
    if (currentPhase === PHASES.waiting || isBatching) {
      lifeCycle.startChecking();

      const hasUpdate = this.updateState(newState);

      if (hasUpdate) {
        this.color = 'GREEN';

        if (!isBatching) {
          lifeCycle.startDeriving();
          lifeCycle.startNotifying();
        }
      } else {
        lifeCycle.startWaiting();
      }
    }
  }

  updateState(newState: T | undefined): boolean {
    if (newState !== undefined && newState !== this.state) {
      this.state = newState;
      this.color = 'GREEN';
      flagsGlobals.addListener(this);
      
      this.checkEffects();
      this.checkChildren();

      return true;
    } 
    
    this.color = 'BLACK';
    return false;
  }

  recalculateState(): void {
    this.dependencies.clear();
    const newState = calculateStateValue(this, this.computationFn);
    this.type = this.defineDerivedType();

    this.updateState(newState);
  }

  check(): void {
    if (this.type === 'SIMPLE'){
      this.recalculateState();
    } else {
      this.color = 'RED';
      flagsGlobals.addAtomDerive(this);
      this.checkChildren();
    }
  }

  sync(): boolean {
    let hasUpdate: boolean = false;
    this.dependencies.forEach(dep => {
      const status = dep.getStatus();
      if (status === 'RED') {
        const newStatus = dep.sync();

        if (newStatus) hasUpdate = true;
      } 
      
      if (status === 'GREEN') {
        hasUpdate = true;
      }
    });

    if (hasUpdate) {
      this.recalculateState();
    } else {
      this.color = 'BLACK';
    }

    return hasUpdate;
  }
}
