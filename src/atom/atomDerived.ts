import { StatusColors, Atom, DerivedTypes } from "./types";
import flagsGlobals from '../globals/flags';
import { lifeCycle, PHASES } from "../globals/life-cycle";


const calculateStateValue = <T>(atom: Atom<T>, func: () => T | Promise<T>, forced: boolean = false) => {
  if (forced) {
    flagsGlobals.addCurrentAtom(null);
    const fnResult = func();

    return fnResult instanceof Promise ? atom.getPureState() : fnResult;
  }

  flagsGlobals.addCurrentAtom(atom);
  const fnValue = func();
  if (fnValue instanceof Promise) {
    fnValue.then(value => {
      atom.asyncUpdate(value);
    });

    flagsGlobals.addCurrentAtom(null);
    return undefined;
  }

  flagsGlobals.addCurrentAtom(null);
  //console.log('fnValue', fnValue)

  return fnValue;
};

export class AtomDerived<T> {
  private listeners: Set<() => void>;
  private children: Set<Atom<T>>;
  private dependencies: Set<Atom<T>>;
  private effects: Set<Atom<T>>;
  private state: T | undefined;
  private color: StatusColors;
  private type: DerivedTypes;
  private computationFn: () => T;

  constructor(fn: () => T) {
    this.dependencies = new Set();
    this.color = 'WHITE';
    this.computationFn = fn;
    this.children = new Set();
    this.listeners = new Set();
    this.type = 'SINGLE';
    this.effects = new Set();
  }

  private defineDerivedType(): DerivedTypes {
    if (this.dependencies.size > 1) return 'MULTI';
    if (this.dependencies.size === 0) return 'SINGLE';

    const it = this.dependencies.values();
    const first = it.next();
    const dependency = first.value;
    //console.log('dependency', this.dependencies)

    return dependency.type === 'MULTI' ? 'MULTI' : 'SINGLE';
  }
  
  verifyIsActiveAtom(): boolean {
    return this.children.size !== 0
  };

  addDeps(dep: Atom<T>):void {
    this.dependencies.add(dep);
  }

  sub(fn: () => void): void {
    this.listeners.add(fn);
  }

  runListeners():void {
    this.listeners.forEach(fn => {
      fn();
    });

    const isActiveAtom = this.verifyIsActiveAtom();
    if (isActiveAtom) {
      this.color = 'GREEN';
    }
  }

  getStatus(): StatusColors {
    return this.color;
  }

  getPureState(): T {
    return this.state as T;
  }

  get(): T {
    const CURRENT_ATOM = flagsGlobals.getCurrentAtom<T>();

    if (this.color === 'WHITE' && this.state === undefined) {
      this.setInitialState();
    } 
    
  console.log('GET',{
        currentPhase: lifeCycle.getPhase(),
        color: this.color,
        state: this.state,
        ins: this
      })
    if ((this.color === 'RED' || this.color === 'YELLOW') && lifeCycle.getPhase() === PHASES.waiting) {
      const newState = calculateStateValue(this as unknown as Atom<T>, this.computationFn, true);

      if (this.state !== newState) {
        this.state = newState;
        this.color = 'GREEN';
        console.log('GET UPDATE')

        return newState as T;
      }

      return this.state as T;
    } 
    
    if (CURRENT_ATOM !== null) {
      CURRENT_ATOM.addDeps(this as unknown as Atom<T>);

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
      console.log('updateState')
      this.color = 'RED';
      this.state = newState;
      flagsGlobals.addListener<T>(this as unknown as Atom<T>);
      
      this.checkEffects();
      this.checkChildren();

      return true;
    } 
    
    this.color = 'GREEN';

    return false;
  }

  setInitialState(): void {
    //console.log('init')
    const newState = calculateStateValue(this as unknown as Atom<T>, this.computationFn);
    this.color = 'GREEN';
    this.state = newState
    this.type = this.defineDerivedType();

    //console.log('this', this)
  }

  recalculateState(): void {
    this.dependencies.clear();
    const newState = calculateStateValue(this as unknown as Atom<T>, this.computationFn);
    this.type = this.defineDerivedType();

    this.updateState(newState);
  }

  checkChildren():void {
    const childrenList = [...this.children];
    const nonActiveList = childrenList.filter(atom => atom.verifyIsActiveAtom() === false);
    childrenList.forEach(atom => {
      atom.check();
    });
    this.children = new Set(nonActiveList);
  }

  checkEffects(): void {
    const effectsList = [...this.effects];
    this.effects.clear();
    effectsList.forEach(atom => {
      atom.check();
    });
  }

  check(): void {
    console.log('CHECK', {
      instance: this
    });

    this.color = this.type === 'SINGLE'  ? 'RED' : 'YELLOW';
    if (this.type === 'SINGLE') {
      const isActiveAtom = this.verifyIsActiveAtom();
      if (isActiveAtom) {
        this.dependencies.clear();
        const newState = calculateStateValue(this as unknown as Atom<T>, this.computationFn);
        this.type = this.defineDerivedType();
        //console.log('SINGLE', {isActiveAtom, newState, instance: this});
        this.updateState(newState);
        //this.recalculateState();
      } else {
        this.color = 'RED';
      }
    } else {
      console.log('addToDerive')
      flagsGlobals.addAtomDerive<T>(this as unknown as Atom<T>);
      this.checkChildren();
    }
  }

  sync(): boolean {
    if (this.color !== 'GREEN') {
      let hasUpdate: boolean = this.color === 'RED';
      
      if (this.color !== 'RED') {
        this.dependencies.forEach(dep => {
          const status = dep.getStatus();
          if (status === 'RED') {
            hasUpdate = true;
          } else if (status === 'YELLOW') {
            const newStatus = dep.sync();
  
            if (newStatus) hasUpdate = true;
          } 
        });
      }

      if (hasUpdate) {
        const isActiveAtom = this.verifyIsActiveAtom();

        if (isActiveAtom) {
          this.recalculateState();
        } else {
          this.color = 'RED';
          flagsGlobals.addListener<T>(this as unknown as Atom<T>);
        }
      } else {
        this.color = 'GREEN';
      }

      return hasUpdate;
    }

    return false;
  }
}
