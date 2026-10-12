"use client";

import { useEffect, useState } from "react";

/**
 * Returns `value`, but only after it has stopped changing for `delay` ms.
 * Typing "design" updates the URL once instead of 6 times.
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    // A new keystroke clears the previous timer → only the last value "wins"
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
