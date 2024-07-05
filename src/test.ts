//import { createLifeCycle } from "./life-cycle";
import { atom, derived, effect, batchUpdates } from "./index";
import flagsGlobals from "./globals/flags";
/* const lifeCycle = createLifeCycle();

console.log(lifeCycle.getPhase());
lifeCycle.startChecking();
console.log(lifeCycle.getPhase());
lifeCycle.startNotifying();
console.log(lifeCycle.getPhase());
lifeCycle.finishCycle();
console.log(lifeCycle.getPhase()); */

/* const A = atom<number>(10);
const B = derived(() => A.get() + 1);
const C = derived(() => A.get() + 2);
const D = derived(() => B.get() + C.get());
A.sub(() => console.log('A'))
B.sub(() => console.log('B'))
C.sub(() => console.log('C'))
D.sub(() => console.log('D'))


A.set(11); */

const A = atom<number>(10);
const E = atom<number>(30);
const Z = atom<number>(50);

const B = derived(() => A.get() + 1);
const C = derived(() => A.get() + E.get() + Z.get());
const F = derived(() => E.get() + 10);
const D = derived(() => B.get() + C.get() + F.get());


A.sub(() => console.log('A'))
B.sub(() => console.log('B'))
C.sub(() => console.log('C'))
D.sub(() => console.log('D'))
E.sub(() => console.log('E'))
F.sub(() => console.log('F'))
Z.sub(() => console.log('Z'))

batchUpdates(() => {
  A.set(11);
  E.set(31);
});
console.log('______________________________________')

setTimeout(() => {
  Z.set(51);
}, 2000)

effect(() => {
  console.log(`Effect: ${C.get()}-${D.get()}`)  
});

console.log('lifecycle', {
  listeners: flagsGlobals.getListeners(),
  toDerive: flagsGlobals.getAtomsToDerive(),
  ef
});
