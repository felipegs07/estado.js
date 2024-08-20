import { StatusColors, Atom, DerivedTypes } from "./types";
import flagsGlobals from '../globals/flags';
import { lifeCycle, PHASES } from "../globals/life-cycle";

const calculateStateValue = <T>(atom: Atom<T>, func: () => T | Promise<T>, forced: boolean = false) => {
  const oldAtom = flagsGlobals.getCurrentAtom();
  console.log('oldAtom', oldAtom);
  console.log('currentAtom', atom);
  console.log('-------------------')
  flagsGlobals.addCurrentAtom(atom);

  if (forced) {
    const fnResult = func();
    flagsGlobals.addCurrentAtom(null);
    return fnResult instanceof Promise ? atom.getPureState() : fnResult;
  }

  const fnValue = func();
  if (fnValue instanceof Promise) {
    fnValue.then(value => {
      atom.asyncUpdate(value);
    });

    flagsGlobals.addCurrentAtom(null);
    return undefined;
  }

  if (oldAtom !== null) {
    flagsGlobals.addCurrentAtom(oldAtom);
  } else {
    flagsGlobals.addCurrentAtom(null);
  }

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
  private isAsync: boolean;

  constructor(fn: () => T) {
    this.isAsync = false;
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

    return dependency.type === 'MULTI' ? 'MULTI' : 'SINGLE';
  }
  
  verifyIsActiveAtom(): boolean {
    return this.children.size !== 0 || this.effects.size !== 0 || this.isAsync;
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
    console.log('LISTENER', {
      thIs: this,
      isActiveAtom,
      children: this.children.size,
      effects: this.effects.size
    })
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

  connectAtoms(currentAtom: Atom<T>): void {
    if (currentAtom !== null) {
      currentAtom.addDeps(this as unknown as Atom<T>);

      if (currentAtom?.type === 'EFFECT') {
        this.effects.add(currentAtom);
      } else {
        this.children.add(currentAtom);
      }
    }
  }

  get(): T {
    const CURRENT_ATOM = flagsGlobals.getCurrentAtom<T>();

    if (this.color === 'WHITE' && this.state === undefined) {
      this.setInitialState();
    } 
    
    console.log('GET',{
      currentAtom: CURRENT_ATOM,
        currentPhase: lifeCycle.getPhase(),
        thiS: this,
        color: this.color
      })
    if ((this.color === 'RED' || this.color === 'YELLOW') && (lifeCycle.getPhase() === PHASES.waiting || lifeCycle.getPhase() === PHASES.notifying)) {
      this.dependencies.clear();
      this.children.clear();
      this.connectAtoms(CURRENT_ATOM);
  
      
      const newState = calculateStateValue(this as unknown as Atom<T>, this.computationFn, true);

      if (this.state !== newState) {
        this.state = newState;
        this.color = 'GREEN';
        this.runListeners();
        console.log('GET UPDATE')

        return newState as T;
      }

      return this.state as T;
    } 
    
    this.connectAtoms(CURRENT_ATOM);

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
        this.isAsync = true;

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
      console.log('updateState', {thisI: this, newState})
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
    this.dependencies.clear();
    const newState = calculateStateValue(this as unknown as Atom<T>, this.computationFn);
    this.color = 'GREEN';
    this.state = newState
    this.type = this.defineDerivedType();
    this.runListeners();

    //console.log('this', this)
  }

  recalculateState(): void {
    this.dependencies.clear();
    const newState = calculateStateValue(this as unknown as Atom<T>, this.computationFn);
    this.type = this.defineDerivedType();

    this.updateState(newState);
  }

  checkChildren(): void {
    const childrenList = [...this.children];
    const nonActiveList = childrenList.filter(atom => atom.verifyIsActiveAtom() === false);
    childrenList.forEach(atom => {
      atom.check();
    });
    console.log('checkChildren', {
      childrenList,
      nonActiveList,
      children: [...this.children]
    })
    if (nonActiveList?.length > 0) {
      this.children = new Set(nonActiveList);
    }
  }

  checkEffects(): void {
    const effectsList = [...this.effects];
    this.effects.clear();
    effectsList.forEach(atom => {
      atom.check();
    });
  }

  check(): void {
    this.color = this.type === 'SINGLE'  ? 'RED' : 'YELLOW';
    console.log('CHECK', {
      instance: this,
      test: this.type === 'SINGLE'  ? 'RED' : 'YELLOW',
      children: [...this.children]
    });
    if (this.type === 'SINGLE') {
      const isActiveAtom = this.verifyIsActiveAtom();
      console.log('isActiveAtom', isActiveAtom)
      if (isActiveAtom) {
        this.recalculateState();
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
