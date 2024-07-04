import flagsGlobals from "./flags";

export const PHASES = {
  waiting: "WAITING",
  checking: "CHECKING",
  deriving: "DERIVING",
  notifying: "NOTIFYING",
};

const createLifeCycle = () => {
  let state = PHASES.waiting;

  const startChecking = () => {
    state = PHASES.checking;
  };

  const startDeriving = () => {
    state = PHASES.deriving;

    flagsGlobals.runAtomsDerivation();
  };

  const startNotifying = () => {
    state = PHASES.notifying;

    flagsGlobals.runListeners();
    flagsGlobals.clearAllAtoms();
    
    state = PHASES.waiting;
  };

  const getPhase = () => {
    return state;
  };

  return {
    startChecking,
    startDeriving,
    startNotifying,
    getPhase,
  };
};

export const lifeCycle = createLifeCycle();