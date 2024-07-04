import { Atom, Flags } from '../atom/types';

const createFlags = () => {
  let CURRENT_ATOM: Atom | null = null;
  let LISTENERS: Set<Atom> = new Set();
  let ATOMS_DERIVE: Set<Atom> = new Set();

  const getCurrentAtom = () => CURRENT_ATOM;

  const getListeners = () => LISTENERS;

  const getAtomsToDerive = () => ATOMS_DERIVE;

  const addCurrentAtom = (atom: Atom) => {
    CURRENT_ATOM = atom;
  };

  const addListener = (atom: Atom) => {
    LISTENERS.add(atom);
  };

  const addAtomDerive = (atom:Atom) => {
    ATOMS_DERIVE.add(atom);
  };

  const runListeners = () => {
    LISTENERS.forEach(atom => {
      atom.runListeners();
    });
  };

  const runAtomsDerivation = () => {
    ATOMS_DERIVE.forEach(atom => {
      atom.sync();
    });
  };

  const clearCurrentAtom = () => {
    CURRENT_ATOM = null;
  };

  const clearAllAtoms = () => {
    LISTENERS.clear();
    ATOMS_DERIVE.clear();
  }

  return {
    getCurrentAtom,
    getListeners,
    getAtomsToDerive,
    addCurrentAtom,
    addListener,
    addAtomDerive,
    runListeners,
    runAtomsDerivation,
    clearCurrentAtom,
    clearAllAtoms
  }
};

const flagsGlobals = createFlags();
export default flagsGlobals;