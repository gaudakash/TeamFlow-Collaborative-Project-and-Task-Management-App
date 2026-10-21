"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { THEME_OPTIONS } from "@/components/theme-toggle";

// true in the browser, false during server rendering. Avoids a hydration mismatch,
// because the server can't know which theme the user picked.
const useIsClient = () =>
  useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

export function ThemeSettings() {
  const { theme, setTheme } = useTheme();
  const isClient = useIsClient();

  return (
    // Native radio buttons = keyboard arrow keys and screen reader support for free
    <fieldset>
      <legend className="sr-only">Theme</legend>
      <div className="grid grid-cols-3 gap-3">
        {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
          <label
            key={value}
            className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border p-4 text-sm transition-colors hover:bg-accent has-[:checked]:border-primary has-[:checked]:bg-accent has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
          >
            <input
              type="radio"
              name="theme"
              value={value}
              checked={isClient && theme === value}
              onChange={() => setTheme(value)}
              className="sr-only"
            />
            <Icon className="size-5" aria-hidden />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
