module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaFeatures: { jsx: true }, sourceType: 'module' },
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  env: { 'react-native/react-native': true, es2021: true },
  ignorePatterns: ['node_modules/', 'dist/', '.expo/', 'babel.config.js'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    'no-undef': 'off',
  },
};
