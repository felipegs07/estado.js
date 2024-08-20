import { AtomTypes, Atom } from "./types";
import flagsGlobals from '../globals/flags';


const executeEffectFn = <T>(atom: Atom<T>, computationFn: () => T) => {
  flagsGlobals.addCurrentAtom(atom);
  computationFn();
  flagsGlobals.addCurrentAtom(null);
};

export class AtomEffect<T> {
  private dependencies: Set<Atom<T>>;
  private computationFn: () => T;
  type: AtomTypes;

  constructor(fn: () => T) {
    this.type = 'EFFECT';
    this.dependencies = new Set();
    this.computationFn = fn;

    executeEffectFn(this as unknown as Atom<T>, fn);
  }

  private executeEffect():void {
    this.dependencies.clear();
    executeEffectFn(this as unknown as Atom<T>, this.computationFn);
  }

  addDeps(dep: Atom<T>):void {
    this.dependencies.add(dep);
  }

  runListeners():void {
    this.executeEffect();
  }

  check(): void {
    flagsGlobals.addAtomDerive<T>(this as unknown as Atom<T>);
  }

  sync(): boolean {
    let hasUpdate: boolean = false;
    this.dependencies.forEach(dep => {
      const status = dep.getStatus();
      if (status === 'YELLOW') {
        const newStatus = dep.sync();

        if (newStatus) hasUpdate = true;
      } 
      
      if (status === 'RED') {
        hasUpdate = true;
      }
    });

    if (hasUpdate) {
      flagsGlobals.addListener<T>(this as unknown as Atom<T>);
    }

    // just to keep the method default
    return false;
  }
}
