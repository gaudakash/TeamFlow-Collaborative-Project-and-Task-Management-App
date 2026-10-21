import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  // Vite 8 compiles JSX with Oxc. "automatic" = no need for `import React` in every file.
  // No @vitejs/plugin-react: tests don't need Fast Refresh, and it caused a Babel version conflict.
  oxc: { jsx: { runtime: "automatic" } },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    css: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: [
        "src/lib/**",
        "src/hooks/**",
        "src/stores/**",
        "src/components/**",
      ],
      exclude: [
        "src/components/ui/**",
        "src/lib/supabase/**",
        "**/*.test.*",
        "src/test/**",
      ],
    },
  },
});
