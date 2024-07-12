//import { createLifeCycle } from "./life-cycle";
import { state, derived, effect, batchUpdates } from "./index";
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

const A = state<number>(10);
const E = state<number>(30);
const Z = state<number>(50);

const B = derived(() => A.get() + 1);
const C = derived(() => A.get() + E.get() + Z.get());
const F = derived(() => E.get() + 10);
const D = derived(() => B.get() + C.get() + F.get());


effect(() => {
  A.get();
  console.log('A');
});
effect(() => {
  B.get();
  console.log('B');
});
effect(() => {
  C.get();
  console.log('C');
});
effect(() => {
  D.get();
  console.log('D')
});
effect(() => {
  E.get();
  console.log('E')
});
effect(() => {
  F.get();
  console.log('F')
});
effect(() => {
  Z.get();
  console.log('Z')
});

console.log('______________________________________');

batchUpdates(() => {
  A.set(11);
  E.set(31);
});

/*
setTimeout(() => {
  Z.set(51);
}, 2000)

effect(() => {
  console.log(`Effect: ${C.get()}-${D.get()}`)  
}); */

/* const A = state<number>(10);
const B = derived(() => A.get() + 1);
const C = derived(() => A.get() + 2);
const D = derived(() => B.get() + C.get());

effect(() => {
  A.get();
  console.log('A');
});
effect(() => {
  B.get();
  console.log('B');
});
effect(() => {
  C.get();
  console.log('C');
});
effect(() => {
  D.get();
  console.log('D')
});

console.log('_____________________________')
A.set(11); */

console.log('lifecycle', {
  listeners: flagsGlobals.getListeners(),
  toDerive: flagsGlobals.getAtomsToDerive(),
});