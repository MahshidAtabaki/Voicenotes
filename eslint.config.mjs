import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // The RC `react-hooks/refs` rule (shipped with the Next 16 scaffold)
      // false-positives on our context store: it flags plain values and
      // callback refs read through the shared `useVC()` object. The stable
      // event-callback pattern in lib/store.tsx reads live state via a ref by
      // design. Keep rules-of-hooks and exhaustive-deps; disable this one.
      "react-hooks/refs": "off",
    },
  },
]);

export default eslintConfig;
