import type { Config } from '@jest/types'; // @jest/types@^29.0.0

/*
 * Jest Configuration for Estate Kit Frontend
 * Configures test environment, coverage reporting, module resolution, and test patterns
 * for React components and utilities with TypeScript integration
 */
const config = (): Config.InitialOptions => {
  return {
    // Use ts-jest preset for TypeScript integration
    preset: 'ts-jest',

    // Configure jsdom test environment for React component testing
    testEnvironment: 'jsdom',

    // Setup files to run after environment is setup
    setupFilesAfterEnv: [
      '@testing-library/jest-dom/extend-expect'
    ],

    // Module name mapping for path aliases and asset handling
    moduleNameMapper: {
      // Map @ alias to src directory for consistent imports
      '^@/(.*)$': '<rootDir>/src/$1',
      
      // Handle style imports
      '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
      
      // Handle image/asset imports
      '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/src/utils/test.util.ts'
    },

    // Configure file transforms
    transform: {
      // Transform TypeScript files
      '^.+\\.tsx?$': 'ts-jest',
      // Transform SVG files
      '^.+\\.svg$': 'jest-transform-stub'
    },

    // Test file patterns
    testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.[jt]sx?$',

    // File extensions to consider
    moduleFileExtensions: [
      'ts',
      'tsx',
      'js',
      'jsx',
      'json',
      'node'
    ],

    // Coverage collection configuration
    collectCoverageFrom: [
      'src/**/*.{ts,tsx}',
      '!src/**/*.d.ts',
      '!src/**/index.{ts,tsx}',
      '!src/vite-env.d.ts'
    ],

    // Coverage thresholds
    coverageThreshold: {
      global: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80
      }
    },

    // Paths to ignore during testing
    testPathIgnorePatterns: [
      '/node_modules/',
      '/dist/'
    ],

    // TypeScript configuration for ts-jest
    globals: {
      'ts-jest': {
        tsconfig: '<rootDir>/tsconfig.json'
      }
    }
  };
};

export default config;