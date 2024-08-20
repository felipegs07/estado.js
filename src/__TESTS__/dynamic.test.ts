import { expect, describe, it } from 'vitest';
import { state, derived } from '../index';

describe('State', () => {
  it('dynamic sources recalculate correctly', () => {
    const a = state(false);
    const b = state(2);
    let count = 0;

    const c = derived(() => {
      count++;
      a.get() || b.get();
    });

    c.get();
    expect(count).toBe(1);
    a.set(true);
    c.get();
    expect(count).toBe(2);

    b.set(4);
    c.get();
    expect(count).toBe(2);
  });

  it("dynamic sources don't re-execute a parent unnecessarily", () => {
    const s = state(2);
      const a = derived(() => s.get() + 1);
      let bCount = 0;
      const b = derived(() => {
        // b depends on s, so b's always dirty when s changes, but b may be unneeded.
        bCount++;
        return s.get() + 10;
      });
      const l = derived(() => {
        let result = a.get();
        if (result & 0x1) {
          result += b.get(); // only execute b if a is odd
        }
        return result;
      });

      expect(l.get()).toEqual(15);
      expect(bCount).toEqual(1);
      s.set(3);
      expect(l.get()).toEqual(4);
      expect(bCount).toEqual(1);
  });

  it('dynamic source disappears entirely', () => {
    const s = state(1);
    let done = false;
    let count = 0;

    const c = derived(() => {
      count++;

      if (done) {
        return 0;
      } else {
        const value = s.get();
        if (value > 2) {
          done = true; // break the link between s and c
        }
        return value;
      }
    });

    expect(c.get()).toBe(1);
    expect(count).toBe(1);
    s.set(3);
    expect(c.get()).toBe(3);
    expect(count).toBe(2);

    s.set(1); // we've now locked into 'done' state
    expect(c.get()).toBe(0);
    expect(count).toBe(3);

    // we're still locked into 'done' state, and count no longer advances
    // in fact, c() will never execute again..
    s.set(0);
    expect(c.get()).toBe(0);
    expect(count).toBe(3);
  });

  it('small dynamic graph with signal grandparents', () => {
    const z = state(3);
    const x = state(0);

    const y = state(0);
    const i = derived(() => {
      let a = y.get();
      z.get();
      if (!a) {
        return x.get();
      } else {
        return a;
      }
    });
    const j = derived(() => {
      let a = i.get();
      z.get();
      if (!a) {
        return x.get();
      } else {
        return a;
      }
    });
    j.get();
    x.set(1);
    j.get();
    y.set(1);
    j.get();
  });

});