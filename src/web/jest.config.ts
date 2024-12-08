// Jest configuration for Estate Kit frontend application
// @ts-jest version: ^29.0.0
// @testing-library/react version: ^13.0.0
// jest version: ^29.0.0

// Import necessary dependencies
import type { Config } from 'jest';
import { compilerOptions } from './tsconfig.json';

/**
 * Configures Jest with TypeScript support and React testing utilities.
 * Addresses requirement: Testing Framework Consistency
 * Location: Technical Specifications/4.5 Development & Deployment/Testing
 */
const jestConfig: Config = {
  // Specify test environment for React component testing
  testEnvironment: 'jsdom',

  // Configure TypeScript transformation using ts-jest
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },

  // Configure module path mapping to match TypeScript configuration
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)',
  ],

  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/',
    '/dist/',
  ],

  // Setup files and environment configuration
  setupFilesAfterEnv: ['@testing-library/jest-dom'],
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Root directory configuration
  roots: ['<rootDir>/src'],

  // Ensure strict type checking matches TypeScript configuration
  globals: {
    'ts-jest': {
      tsconfig: {
        ...compilerOptions,
        strict: true,
      },
    },
  },

  // Test timeout configuration
  testTimeout: 10000,

  // Verbose output for detailed test results
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Error handling configuration
  errorOnDeprecated: true,

  // Fail tests on console errors
  maxWorkers: '50%',

  // Watch plugin configuration
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
};

export default jestConfig;