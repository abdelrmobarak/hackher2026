import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const flatCompat = new FlatCompat({
  baseDirectory: currentDirectory
});

const config = [
  {
    ignores: [
      ".next/**",
      ".deepsafe-upstream/**",
      "deepsafe/**",
      "node_modules/**",
      ".pnpm-store/**",
      "next-env.d.ts"
    ]
  },
  ...flatCompat.extends("next/core-web-vitals", "next/typescript")
];

export default config;
