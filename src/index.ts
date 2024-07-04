import { AtomRoot } from './atom/atomRoot';
import { AtomDerived } from './atom/atomDerived';
import { AtomEffect } from './atom/atomEffect';

export const atom = <T>(initialValueOrFn: T | (() => T)) => new AtomRoot<T>(initialValueOrFn);
export const derived = <T>(initialValueOrFn: () => T) => new AtomDerived<T>(initialValueOrFn);

export const effect = (callback: () => void) => {
  return new AtomEffect(callback);
};