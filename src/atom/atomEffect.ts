import { AtomTypes, Atom } from "./types";
import flagsGlobals from '../globals/flags';


const executeEffectFn = <T>(atom: Atom, computationFn: () => T) => {
  flagsGlobals.addCurrentAtom(atom);
  computationFn();
  flagsGlobals.clearCurrentAtom();
};

export class AtomEffect<T> {
  dependencies: Set<Atom>;
  computationFn: () => T;
  type: AtomTypes;

  constructor(fn: () => T) {
    this.type = 'EFFECT';
    this.dependencies = new Set();
    this.computationFn = fn;

    executeEffectFn(this, fn);
  }

  executeEffect():void {
    this.dependencies.clear();
    executeEffectFn(this, this.computationFn);
  }
}
