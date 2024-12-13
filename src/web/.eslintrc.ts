// ESLint configuration for Estate Kit frontend
// Dependencies:
// @typescript-eslint/eslint-plugin@^5.59.0
// @typescript-eslint/parser@^5.59.0
// eslint-plugin-react@^7.32.2
// eslint-plugin-react-hooks@^4.6.0
// eslint-config-prettier@^8.8.0
// eslint-plugin-prettier@^4.2.1

module.exports = {
  // Specify this is a root configuration to prevent ESLint from searching beyond this directory
  root: true,

  // Use TypeScript parser for enhanced type checking
  parser: '@typescript-eslint/parser',

  // Parser options for TypeScript and React support
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
    // Reference to TypeScript configuration for type-aware linting
    project: './tsconfig.json',
  },

  // Required plugins for TypeScript, React, and Prettier integration
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
    'prettier',
  ],

  // Extended configurations for comprehensive rule sets
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:prettier/recommended',
  ],

  // React-specific settings
  settings: {
    react: {
      version: '18.2',
    },
  },

  // Custom rule configurations
  rules: {
    // Prettier integration
    'prettier/prettier': 'error',

    // React specific rules
    'react/react-in-jsx-scope': 'off', // Not needed in React 18+
    'react-hooks/rules-of-hooks': 'error', // Enforce hooks rules
    'react-hooks/exhaustive-deps': 'warn', // Check effect dependencies

    // TypeScript specific rules
    '@typescript-eslint/explicit-function-return-type': 'off', // Allow type inference
    '@typescript-eslint/no-unused-vars': ['error', {
      'argsIgnorePattern': '^_', // Allow unused variables starting with underscore
    }],
    '@typescript-eslint/no-explicit-any': 'error', // Prevent usage of 'any' type
    '@typescript-eslint/no-unsafe-assignment': 'error', // Prevent unsafe assignments
    '@typescript-eslint/no-unsafe-member-access': 'error', // Prevent unsafe member access
    '@typescript-eslint/no-unsafe-call': 'error', // Prevent unsafe function calls

    // Additional strict TypeScript rules
    '@typescript-eslint/ban-ts-comment': ['error', {
      'ts-expect-error': 'allow-with-description',
      'ts-ignore': true,
      'ts-nocheck': true,
      'ts-check': false,
    }],
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/no-misused-promises': 'error',
    '@typescript-eslint/no-unnecessary-type-assertion': 'error',
    '@typescript-eslint/prefer-as-const': 'error',
    '@typescript-eslint/require-await': 'error',
    '@typescript-eslint/restrict-plus-operands': 'error',
    '@typescript-eslint/restrict-template-expressions': 'error',
    '@typescript-eslint/unbound-method': 'error',
  },

  // Environment configuration
  env: {
    browser: true,
    es2022: true,
    node: true,
    jest: true,
  },

  // Files to ignore
  ignorePatterns: [
    'dist',
    'build',
    'coverage',
    'node_modules',
    'vite.config.ts',
    'jest.config.ts',
  ],

  // Overrides for specific file patterns
  overrides: [
    {
      // Test files
      files: ['**/*.test.ts', '**/*.test.tsx'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off', // Allow 'any' in tests
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
      },
    },
    {
      // Story files for Storybook
      files: ['**/*.stories.tsx'],
      rules: {
        'react-hooks/rules-of-hooks': 'off',
      },
    },
  ],
};