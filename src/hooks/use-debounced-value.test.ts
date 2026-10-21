import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDebouncedValue } from "./use-debounced-value";

describe("useDebouncedValue", () => {
  // Fake timers: we control time, so tests don't actually wait 300ms
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const setup = (initial = "a", delay = 300) =>
    renderHook(({ value }) => useDebouncedValue(value, delay), {
      initialProps: { value: initial },
    });

  it("returns the initial value immediately", () => {
    const { result } = setup("hello");
    expect(result.current).toBe("hello");
  });

  it("updates only after the delay has passed", () => {
    const { result, rerender } = setup("a");

    rerender({ value: "ab" });
    expect(result.current).toBe("a");

    act(() => vi.advanceTimersByTime(299));
    expect(result.current).toBe("a");

    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe("ab");
  });

  it("only the last value wins when typing quickly", () => {
    const { result, rerender } = setup("");

    for (const value of ["d", "de", "des", "desi", "design"]) {
      rerender({ value });
      act(() => vi.advanceTimersByTime(100)); // each keystroke 100ms apart: timer keeps resetting
    }
    expect(result.current).toBe(""); // never stopped for 300ms yet

    act(() => vi.advanceTimersByTime(300));
    expect(result.current).toBe("design"); // one update, not five
  });

  it("does not update after unmount (no memory leak)", () => {
    const { rerender, unmount } = setup("a");
    rerender({ value: "b" });
    unmount();
    expect(() => act(() => vi.advanceTimersByTime(1000))).not.toThrow();
    expect(vi.getTimerCount()).toBe(0); // timer was cleared
  });
});
