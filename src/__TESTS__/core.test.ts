import { expect, describe, it } from 'vitest';
import { state, derived } from '../index';

describe('State', () => {
  it('two signals', () => {
    const a = state(7);
    const b = state(1);
    let callCount = 0;

    const c = derived(() => {
      callCount++;
      return a.get() * b.get();
    });

    a.set(2);
    expect(c.get()).toBe(2);

    b.set(3);
    expect(c.get()).toBe(6);

    expect(callCount).toBe(2);
    c.get();
    
    expect(callCount).toBe(2);
  });

  it('dependent computed', () => {
    const a = state(7);
    const b = state(1);
    let callCount1 = 0;
    const c = derived(() => {
      callCount1++;
      return a.get() * b.get();
    });

    let callCount2 = 0;
    const d = derived(() => {
      callCount2++;
      return c.get() + 1;
    });

    expect(d.get()).toBe(8);
    expect(callCount1).toBe(1);
    expect(callCount2).toBe(1);
    a.set(3);
    expect(d.get()).toBe(4);
    expect(callCount1).toBe(2);
    expect(callCount2).toBe(2);
  });

  it('equality check', () => {
    let callCount = 0;
    const a = state(7);
    const c = derived(() => {
      callCount++;
      return a.get() + 10;
    });
    c.get();
    c.get();
    expect(callCount).toBe(1);
    a.set(7);
    expect(callCount).toBe(1); // unchanged, equality check
  });

  it('dynamic computed', () => {
    const a = state(1);
    const b = state(2);
    let callCountA = 0;
    let callCountB = 0;
    let callCountAB = 0;

    const cA = derived(() => {
      console.log('CALCULATION', callCountA + 1)      
      callCountA++;
      return a.get();
    });

    const cB = derived(() => {
      callCountB++;
      return b.get();
    });

    const cAB = derived(() => {
      callCountAB++;
      return cA.get() || cB.get();
    });

    expect(cAB.get()).toBe(1);
    a.set(2);
    b.set(3);
    expect(cAB.get()).toBe(2);
    expect(callCountA).toBe(2);
    expect(callCountAB).toBe(2);
    expect(callCountB).toBe(0);
    a.set(0);
    expect(cAB.get()).toBe(3);
    expect(callCountA).toBe(3);
    expect(callCountAB).toBe(3);
    expect(callCountB).toBe(1);
    b.set(4);
    expect(cAB.get()).toBe(4);
    expect(callCountA).toBe(3);
    expect(callCountAB).toBe(4);
    expect(callCountB).toBe(2);
  });

  it('boolean equality check', () => {
    const a = state(0);
    const b = derived(() => a.get() > 0);
    let callCount = 0;
    const c = derived(() => {
      callCount++;
      return b.get() ? 1 : 0;
    });

    expect(c.get()).toBe(0);
    expect(callCount).toBe(1);

    a.set(1);
    expect(c.get()).toBe(1);
    expect(callCount).toBe(2);

    a.set(2);
    expect(c.get()).toBe(1);
    expect(callCount).toBe(2);
  });

  it('diamond computeds', () => {
    const s = state(1);
    const a = derived(() => s.get());
    const b = derived(() => a.get() * 2);
    const c = derived(() => a.get() * 3);
    let callCount = 0;
    const d = derived(() => {
      callCount++;
      return b.get() + c.get();
    });
    expect(d.get()).toBe(5);
    console.log('ATOMS', )
    console.log('_____________________________________')
    //s.debug('DEBUG S')
    a.debug('DEBUG A')
    expect(callCount).toBe(1);
    s.set(2);
    expect(d.get()).toBe(10);
    expect(callCount).toBe(2);
    console.log('_____________________________________')
    //s.debug('DEBUG S')
    a.debug('DEBUG A')
    s.set(3);
    expect(d.get()).toBe(15);
    expect(callCount).toBe(3);
  });

  it('set inside reaction', () => {
    const s = state(1);
    const a = derived(() => s.set(2));
    const l = derived(() => s.get() + 100);

    a.get();
    expect(l.get()).toEqual(102);
  });
});