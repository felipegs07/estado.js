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

/* const A = state<number>(10);
const E = state<number>(30);
const Z = state<number>(50);

const B = derived(() => A.get() + 1);
const C = derived(() => A.get() + E.get() + Z.get());
const F = derived(() => E.get() + 10);
const D = derived(() => B.get() + C.get() + F.get());


effect(() => {
  console.log('A ', A.get());
});
effect(() => {
  console.log('B ', B.get());
});
effect(() => {
  console.log('C ', C.get());
});
effect(() => {
  console.log('D ', D.get())
});
effect(() => {
  console.log('E ', E.get())
});
effect(() => {
  console.log('F ', F.get())
});
effect(() => {
  console.log('Z ', Z.get())
});

console.log('______________________________________');

batchUpdates(() => {
  A.set(11);
  E.set(31);
});
 */
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

const s = state(1);
const a = derived(() => s.get());
const b = derived(() => a.get() * 2);
const c = derived(() => a.get() * 3);
let callCount = 0;
const d = derived(() => {
  callCount++;
  return b.get() + c.get();
});

console.log('TEST: d === 5', d.get() === 5);
console.log('ATOMSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS', {
  s: s.children.size, a: a.children.size, b: b.children.size, c: c.children.size, d: d.children.size
})
s.set(2);
console.log('SET 2 _______________________________________');
console.log('TEST: d === 10', d.get() === 10);
console.log('ATOMSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS', {
  s: s.children.size, a: a.children.size, b: b.children.size, c: c.children.size, d: d.children.size
})
s.set(3);
console.log('SET 3 _______________________________________');
console.log('TEST: d === 15', { test: d.get() === 15, value: d.get()});
console.log('ATOMSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSSS', {
  s: s.children.size, a: a.children.size, b: b.children.size, c: c.children.size, d: d.children.size
})