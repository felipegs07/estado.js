import { expect, vi, describe, it } from 'vitest';
import { state, derived, effect, batchUpdates } from '../index';

describe('batchUpdates', () => {
  it('should run effects in the correctly order when called with batch function', () => {
    const listener = vi.fn();

    const A = state<number>(10);
    const E = state<number>(30);
    const Z = state<number>(50);
    
    const B = derived(() => A.get() + 1);
    const C = derived(() => A.get() + E.get() + Z.get());
    const F = derived(() => E.get() + 10);
    const D = derived(() => B.get() + C.get() + F.get());

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
    effect(() => {
      E.get();
      listener('E')
    });
    effect(() => {
      F.get();
      listener('F')
    });
    effect(() => {
      Z.get();
      listener('Z')
    });

    batchUpdates(() => {
      A.set(11);
      E.set(31);
    });

    expect(listener).toHaveBeenNthCalledWith(1, 'A');
    expect(listener).toHaveBeenNthCalledWith(2, 'B');
    expect(listener).toHaveBeenNthCalledWith(3, 'C');
    expect(listener).toHaveBeenNthCalledWith(4, 'D');
    expect(listener).toHaveBeenNthCalledWith(5, 'E');
    expect(listener).toHaveBeenNthCalledWith(6, 'F');
    expect(listener).toHaveBeenNthCalledWith(7, 'Z');
    
    expect(listener).toHaveBeenNthCalledWith(8, 'A');
    expect(listener).toHaveBeenNthCalledWith(9, 'B');
    expect(listener).toHaveBeenNthCalledWith(10, 'E');
    expect(listener).toHaveBeenNthCalledWith(11, 'F');
    expect(listener).toHaveBeenNthCalledWith(12, 'C');
    expect(listener).toHaveBeenNthCalledWith(13, 'D');
  });
});