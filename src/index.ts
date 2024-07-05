import { AtomRoot } from './atom/atomRoot';
import { AtomDerived } from './atom/atomDerived';
import { AtomEffect } from './atom/atomEffect';
import flagsGlobals from './globals/flags';
import { lifeCycle } from './globals/life-cycle';

export const atom = <T>(initialValueOrFn: T | (() => T)) => {
  const instance = new AtomRoot<T>(initialValueOrFn)
  
  return ({
    sub: (fn: () => void) => {
      instance.sub(fn);
    },
    set: (newValueOrFn: T | any) => {
      instance.set(newValueOrFn);
    },
    get: () => {
      return instance.get();
    }
  });
};
export const derived = <T>(initialValueOrFn: () => T) => {
  const instance = new AtomDerived<T>(initialValueOrFn);

  return ({
    sub: (fn: () => void) => {
      instance.sub(fn);
    },
    get: () => {
      return instance.get();
    }
  });
};
export const effect = (callback: () => void) => {
  new AtomEffect(callback);
};

export const batchUpdates = (updateFn: () => void) => {
  flagsGlobals.runBatching();
  updateFn();
  flagsGlobals.stopBatching();

  lifeCycle.startDeriving();
  lifeCycle.startNotifying();
}