// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // `.eslintignore` is no longer read by flat-config ESLint; its entry lives here.
    ignores: ['dist/*', 'amplify-codegen-temp/models/models'],
  },
  {
    // React Compiler rules that eslint-config-expo 57 turned on as errors. They
    // flag pre-existing patterns (setState in effects, refs read in render, …),
    // not regressions from the SDK upgrade, so they are warnings until fixed in
    // their own PR. The compiler rules that pass today stay at error.
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/static-components': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/purity': 'warn',
    },
  },
  {
    // Node-only code: one-off admin scripts and Lambda handlers. Never bundled
    // by Metro, so the EXPO_PUBLIC inlining rule doesn't apply, and each Lambda
    // resolves its dependencies from its own package.json at deploy time.
    files: ['scripts/**', 'lambda/**'],
    languageOptions: {
      globals: { Buffer: 'readonly', process: 'readonly', console: 'readonly' },
    },
    rules: {
      'expo/no-env-var-destructuring': 'off',
      'import/no-unresolved': 'off',
    },
  },
]);
