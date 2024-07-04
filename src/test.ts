//import { createLifeCycle } from "./life-cycle";
import { atom, derived, effect } from "./index";
import flagsGlobals from "./globals/flags";
/* const lifeCycle = createLifeCycle();

console.log(lifeCycle.getPhase());
lifeCycle.startChecking();
console.log(lifeCycle.getPhase());
lifeCycle.startNotifying();
console.log(lifeCycle.getPhase());
lifeCycle.finishCycle();
console.log(lifeCycle.getPhase()); */

const A = atom<number>(10);
const B = derived(() => A.get() + 1);
const C = derived(() => A.get() + 2);
const D = derived(() => B.get() + C.get());
A.sub(() => console.log('A'))
B.sub(() => console.log('B'))
C.sub(() => console.log('C'))
D.sub(() => console.log('D'))


A.set(11);

console.log('lifecycle', {
  listeners: flagsGlobals.getListeners(),
  toDerive: flagsGlobals.getAtomsToDerive()
});

effect(() => {
  console.log(`Effect: ${B.get()}-${C.get()}`);
});