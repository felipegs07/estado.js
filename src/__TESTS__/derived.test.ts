import { expect, vi, beforeEach, afterEach, describe, it } from 'vitest';
import { state, derived } from '../index';

describe('AtomDerived', () => {
  it('should calculate the derived and recalculate when state changes', () => {
    const mock = vi.fn();
    const a = state(10);
    const b = derived(() => a.get() + 10);
    b.sub(mock);
    expect(b.get()).toBe(20);
    a.set(100);
    expect(b.get()).toBe(110);
    a.set(150);
    expect(b.get()).toBe(160);
    a.set(-10);
    expect(b.get()).toBe(0);
    a.set(-50);
    expect(b.get()).toBe(-40);

    expect(mock).toHaveBeenCalledTimes(4)
  });

  it('should recalculate derived value in a diamont problem just calling listener once', () => {
    const mock = vi.fn();
    const a = state<number>(10);
    const b = derived(() => a.get() + 1);
    const c = derived(() => a.get() + 2);
    const d = derived(() => b.get() + c.get());

    d.sub(mock);
    expect(d.get()).toBe(23);

    a.set(11);
    expect(d.get()).toBe(25);
    expect(mock).toHaveBeenCalledOnce();
  });
});

describe('AtomDerived Async', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should call async function to recalculate derived value when state changes', async () => {
    const mock = vi.fn();
    const a = state(10);
    const b = derived(async () => {
      return new Promise((resolve) => {
        const aValue = a.get();
        setTimeout(() => {
          resolve(aValue * 10);
        }, 100);
      });
    });

    b.sub(mock);

    expect(b.get()).toBe(undefined);
    await vi.advanceTimersByTimeAsync(101);
    expect(b.get()).toEqual(100);
    expect(mock).toHaveBeenCalledOnce();

    a.set(20);
    await vi.advanceTimersByTimeAsync(101);
    expect(b.get()).toEqual(200);
    expect(mock).toHaveBeenCalledTimes(2);
  });
});