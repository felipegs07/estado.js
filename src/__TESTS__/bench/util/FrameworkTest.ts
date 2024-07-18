import { test } from "vitest";
import { ReactiveFramework } from "./ReactiveFramework";
export function frameworkTest<T>(
  f: ReactiveFramework,
  testName: string,
  fn: () => T,
  only: boolean = false
): void {
  if (only) {
    test.only(`${f.name} | ${testName}`, () => {
      fn();
    });
  } else {
    test(`${f.name} | ${testName}`, () => {
      fn();
    });
  }
}
