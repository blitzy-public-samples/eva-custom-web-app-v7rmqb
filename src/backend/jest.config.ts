// @jest/types version: ^29.5.0
// ts-jest version: ^29.1.0

import type { Config } from '@jest/types';

/**
 * Creates and exports a comprehensive Jest configuration for the Estate Kit backend service.
 * This configuration supports both FastAPI and Express.js services with TypeScript,
 * implements strict security measures, and ensures thorough test coverage.
 */
const jestConfig: Config.InitialOptions = {
  // Use ts-jest as the default preset for TypeScript support
  preset: 'ts-jest',

  // Set Node.js as the test environment
  testEnvironment: 'node',

  // Define test root directories
  roots: ['<rootDir>/src', '<rootDir>/tests'],

  // Separate patterns for unit and integration tests
  testMatch: [
    '<rootDir>/tests/unit/**/*.test.ts',    // Unit tests
    '<rootDir>/tests/integration/**/*.spec.ts' // Integration tests
  ],

  // Configure coverage collection
  collectCoverageFrom: [
    'src/**/*.ts',
    // Exclude type definitions, migrations, seeders, and barrel files
    '!src/types/**/*.ts',
    '!src/db/migrations/**/*.ts',
    '!src/db/seeders/**/*.ts',
    '!src/**/index.ts',
    '!src/**/*.d.ts'
  ],

  // Coverage output configuration
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',           // Console output
    'lcov',           // HTML report
    'json-summary',   // Summary in JSON
    'html'            // Detailed HTML report
  ],

  // Strict coverage thresholds with higher requirements for critical services
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    'src/services': {  // Higher threshold for service layer
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },

  // Module path aliases matching tsconfig.json
  moduleNameMapper: {
    '@/(.*)': '<rootDir>/src/$1',
    '@test/(.*)': '<rootDir>/tests/$1'
  },

  // Global test setup file
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],

  // Supported file extensions
  moduleFileExtensions: ['ts', 'js', 'json'],

  // TypeScript transformation configuration
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.json',
        isolatedModules: true  // Enable isolated modules for better performance
      }
    ]
  },

  // TypeScript compiler options
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
      diagnostics: {
        warnOnly: true  // Convert errors to warnings for better DX
      }
    }
  },

  // Test execution configuration
  testTimeout: 30000,  // 30 second timeout for slow integration tests
  verbose: true,       // Detailed test output
  clearMocks: true,    // Clear mock calls between tests
  restoreMocks: true,  // Restore mocked implementations

  // Test environment options
  testEnvironmentOptions: {
    url: 'http://localhost'
  },

  // Performance optimization
  maxWorkers: '50%'    // Limit parallel test execution to 50% of CPU cores
};

export default jestConfig;