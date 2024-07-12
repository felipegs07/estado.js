import { expect, vi, describe, it } from 'vitest';
import { state, derived, effect } from '../index';

describe('Effect', () => {
  it('should run effects of a simple diamont problem 2 times and with the correctly values', () => {
    const listenerA = vi.fn();
    const listenerB = vi.fn();
    const listenerC = vi.fn();
    const listenerD = vi.fn();

    const A = state<number>(10);
    const B = derived(() => A.get() + 1);
    const C = derived(() => A.get() + 2);
    const D = derived(() => B.get() + C.get());

    effect(() => {
      listenerA(A.get());
    });
    effect(() => {
      listenerB(B.get());
    });
    effect(() => {
      listenerC(C.get());
    });
    effect(() => {
      listenerD(D.get())
    });

    expect(listenerA).toHaveBeenCalledOnce();
    expect(listenerA).toHaveBeenLastCalledWith(10);
    expect(listenerB).toHaveBeenCalledOnce();
    expect(listenerB).toHaveBeenLastCalledWith(11);
    expect(listenerC).toHaveBeenCalledOnce();
    expect(listenerC).toHaveBeenLastCalledWith(12);
    expect(listenerD).toHaveBeenCalledOnce();
    expect(listenerD).toHaveBeenLastCalledWith(23);

    A.set(100);

    expect(listenerA).toHaveBeenCalledTimes(2);
    expect(listenerA).toHaveBeenLastCalledWith(100);
    expect(listenerB).toHaveBeenCalledTimes(2);
    expect(listenerB).toHaveBeenLastCalledWith(101);
    expect(listenerC).toHaveBeenCalledTimes(2);
    expect(listenerC).toHaveBeenLastCalledWith(102);
    expect(listenerD).toHaveBeenCalledTimes(2);
    expect(listenerD).toHaveBeenLastCalledWith(203);
  });

  it('should run effects of a simple diamont problem in correctly order', () => {
    const listener = vi.fn();

    const A = state<number>(10);
    const B = derived(() => A.get() + 1);
    const C = derived(() => A.get() + 2);
    const D = derived(() => B.get() + C.get());

    effect(() => {
      A.get();
      listener('A');
    });
    effect(() => {
      B.get();
      listener('B');
    });
    effect(() => {
      C.get();
      listener('C');
    });
    effect(() => {
      D.get();
      listener('D')
    });

    A.set(11);
    expect(listener).toHaveBeenNthCalledWith(1, 'A');
    expect(listener).toHaveBeenNthCalledWith(2, 'B');
    expect(listener).toHaveBeenNthCalledWith(3, 'C');
    expect(listener).toHaveBeenNthCalledWith(4, 'D');

    expect(listener).toHaveBeenNthCalledWith(5, 'A');
    expect(listener).toHaveBeenNthCalledWith(6, 'B');
    expect(listener).toHaveBeenNthCalledWith(7, 'C');
    expect(listener).toHaveBeenNthCalledWith(8, 'D');
  });
});