import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "docs/**",
      "test-results/**",
      "*.png",
      "*.jpg",
      "*.jpeg",
      "*.avif",
    ],
  },
  ...nextCoreWebVitals,
];

export default eslintConfig;
