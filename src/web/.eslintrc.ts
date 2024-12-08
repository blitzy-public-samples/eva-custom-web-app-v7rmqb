// Human Tasks:
// 1. Verify all ESLint plugins are installed in package.json with correct versions
// 2. Test ESLint configuration with existing codebase to ensure rules are appropriate
// 3. Validate TypeScript-specific rules work correctly with the project's tsconfig
// 4. Ensure React-specific rules align with the project's React version

// Import theme configuration for consistent styling
// Addresses Frontend Design Consistency requirement from Technical Specifications/3.1 User Interface Design/Design System Specifications
import { palette, typography } from './src/config/theme.config';

// ESLint configuration object
// Addresses Code Quality Enforcement requirement from Technical Specifications/4.5 Development & Deployment/Development Tools
const eslintConfig = {
  // Use TypeScript parser
  // Addresses Frontend TypeScript Configuration requirement from Technical Specifications/4.1 Programming Languages
  parser: '@typescript-eslint/parser',

  // Extend recommended configurations
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended'
  ],

  // Configure required plugins
  plugins: [
    'react',
    '@typescript-eslint',
    'import'
  ],

  // Custom rule configurations
  rules: {
    // Enforce semicolons
    'semi': ['error', 'always'],

    // Enforce single quotes for consistency
    'quotes': ['error', 'single'],

    // Disable prop-types as we use TypeScript for type checking
    'react/prop-types': 'off',

    // Configure unused variables checking
    '@typescript-eslint/no-unused-vars': ['error', {
      'argsIgnorePattern': '^_'
    }],

    // Enforce import order
    'import/order': ['error', {
      'alphabetize': {
        'order': 'asc'
      },
      'groups': [
        'builtin',
        'external',
        'internal',
        'parent',
        'sibling',
        'index'
      ],
      'pathGroups': [
        {
          'pattern': 'react',
          'group': 'external',
          'position': 'before'
        }
      ],
      'pathGroupsExcludedImportTypes': ['react']
    }],

    // Enforce consistent type imports
    '@typescript-eslint/consistent-type-imports': ['error', {
      'prefer': 'type-imports'
    }],

    // Enforce consistent function type definitions
    '@typescript-eslint/method-signature-style': ['error', 'property'],

    // Enforce explicit return types on functions
    '@typescript-eslint/explicit-function-return-type': ['error', {
      'allowExpressions': true,
      'allowTypedFunctionExpressions': true
    }],

    // Enforce consistent naming conventions
    '@typescript-eslint/naming-convention': [
      'error',
      {
        'selector': 'interface',
        'format': ['PascalCase'],
        'prefix': ['I']
      },
      {
        'selector': 'typeAlias',
        'format': ['PascalCase']
      }
    ]
  },

  // React-specific settings
  settings: {
    'react': {
      'version': 'detect'
    },
    'import/resolver': {
      'typescript': {}
    }
  },

  // Environment configuration
  env: {
    'browser': true,
    'es2021': true,
    'node': true
  },

  // Parser options
  parserOptions: {
    'ecmaVersion': 2021,
    'sourceType': 'module',
    'ecmaFeatures': {
      'jsx': true
    }
  }
};

export default eslintConfig;