import { AtomTypes, Atom } from "./types";
import flagsGlobals from '../globals/flags';


const executeEffectFn = <T>(atom: Atom, computationFn: () => T) => {
  flagsGlobals.addCurrentAtom(atom);
  computationFn();
  flagsGlobals.clearCurrentAtom();
};

export class AtomEffect<T> {
  private dependencies: Set<Atom>;
  private computationFn: () => T;
  type: AtomTypes;

  constructor(fn: () => T) {
    this.type = 'EFFECT';
    this.dependencies = new Set();
    this.computationFn = fn;

    executeEffectFn(this, fn);
  }

  private executeEffect():void {
    this.dependencies.clear();
    executeEffectFn(this, this.computationFn);
  }

  addDeps(dep: Atom):void {
    this.dependencies.add(dep);
  }

  runListeners():void {
    this.executeEffect();
  }

  check(): void {
    flagsGlobals.addAtomDerive(this);
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
      flagsGlobals.addListener(this);
    }

    // just to keep the method default
    return false;
  }
}
