import { expect, vi, beforeEach, afterEach, describe, it } from 'vitest';
import { state } from '../index';

describe('State', () => {
  it('should get the initial value and get the same value as state', () => {
    const a = state(10);
    expect(a.get()).toBe(10);
  });
  
  it('should update the value of state when call set method', () => {
    const a = state<number | string | { value: number }>(10);
    expect(a.get()).toBe(10);
    a.set(50);
    expect(a.get()).toBe(50);
    a.set(0)
    expect(a.get()).toBe(0)
    a.set('test')
    expect(a.get()).toBe('test');
    a.set({ value: 10 })
    expect(a.get()).toStrictEqual({ value: 10 });
  });
  
  it('should get the initial state calling a sync function', () => {
    const a = state(10);
    const z = state(90);
    const b = state(() => a.get() + 10 + z.get());
    expect(b.get()).toBe(110);
  });

  it('should call listener function when state changes', () => {
    const mock = vi.fn();
    const a = state(10);
    a.sub(mock);
    a.set(11);
    a.set(12);
    a.set(12);
    a.set(13);
    a.set(14);
    expect(a.get()).toBe(14);
    expect(mock).toHaveBeenCalledTimes(4);
  });
});

describe('State Set with Function', () => {
  it('should change the value using set with function, receiving the old state as argument', () => {
    const a = state(10);
    expect(a.get()).toBe(10);

    a.set((oldState) => {
      return oldState + 10;
    });
    expect(a.get()).toBe(20);
  });

  it('should get the same object reference if the set function just returns the old state', () => {
    const obj = { value: 10 };
    const a = state(obj);
    expect(a.get()).toStrictEqual(obj);

    a.set((oldState) => {
      return oldState;
    });
    expect(a.get()).toEqual(obj);
    expect(a.get()).toStrictEqual({ value: 10 });
  });
});

describe('State Async', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should call initial state function and return undefined in the beggining, but update to the other value', async () => {
    const a = state(async () => {
      return new Promise((resolve) => {
        resolve(100);
      });
    });
    expect(a.get()).toBe(undefined);
    await vi.advanceTimersByTimeAsync(101);
    expect(a.get()).toBe(100);
  });
});