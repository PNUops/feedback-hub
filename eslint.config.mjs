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
    "data/**",
    "node_modules/**",
    "src/components/ui/**",
  ]),
  {
    rules: {
      // 마운트 시 쿠키/세션 스토리지 읽기·초기 데이터 로드는 의도된 패턴.
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
