import { Atom } from '../atom/types';

const createFlags = () => {
  let CURRENT_ATOM: Atom<any> | null = null;
  let LISTENERS: Set<Atom<any>> = new Set();
  let ATOMS_DERIVE: Set<Atom<any>> = new Set();
  let IS_BATCH: boolean = false;

  const getCurrentAtom = <T>() => CURRENT_ATOM as Atom<T>;
  const getListeners = <T>() => LISTENERS as Set<Atom<T>>;
  const getAtomsToDerive = <T>() => ATOMS_DERIVE as Set<Atom<T>>;
  const getIsBatch = () => IS_BATCH;

  const addCurrentAtom = <T>(atom: Atom<T> | null) => {
    CURRENT_ATOM = atom;
  };

  const addListener = <T>(atom: Atom<T>) => {
    LISTENERS.add(atom);
  };

  const addAtomDerive = <T>(atom:Atom<T>) => {
    ATOMS_DERIVE.add(atom);
  };

  const runListeners = () => {
    console.log(' LISTENERS',  LISTENERS)
    LISTENERS.forEach(atom => {
      atom.runListeners();
    });
  };

  const runAtomsDerivation = () => {
    console.log('ATOMS_DERIVE', ATOMS_DERIVE)
    ATOMS_DERIVE.forEach(atom => {
      atom.sync();
    });
  };

  const runBatching = () => {
    IS_BATCH = true;
  };

  const stopBatching = () => {
    IS_BATCH = false;
  };

  const clearAllAtoms = () => {
    LISTENERS.clear();
    ATOMS_DERIVE.clear();
  }

  return {
    getCurrentAtom,
    getListeners,
    getAtomsToDerive,
    getIsBatch,
    addCurrentAtom,
    addListener,
    addAtomDerive,
    runListeners,
    runAtomsDerivation,
    runBatching,
    stopBatching,
    clearAllAtoms
  }
};

const flagsGlobals = createFlags();
export default flagsGlobals;