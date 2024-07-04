import { AtomRoot } from "./atomRoot";
import { AtomDerived } from "./atomDerived";
import { AtomEffect } from "./atomEffect";

export interface Atom {

};
export type Setter<T> = (oldState: T) => T;
export type StatusColors = 'BLACK' | 'RED' | 'GREEN';
export type AtomTypes = 'SIMPLE' | 'MULTI' | 'ROOT' | 'EFFECT';
export type Flags = {
  CURRENT_ATOM: Atom | null;
  COMPUTED_RUN: boolean;
};
export type AtomRootType = typeof AtomRoot;