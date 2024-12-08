// @package jest v29.6.0
// @package ts-jest v29.1.0

/**
 * Human Tasks:
 * 1. Ensure TypeScript is properly configured in tsconfig.json
 * 2. Verify that all path aliases in moduleNameMapper match tsconfig.json paths
 * 3. Configure coverage thresholds based on project requirements
 * 4. Set up continuous integration to run tests with this configuration
 */

/**
 * Requirement: Backend Testing
 * Location: Technical Specifications/4.5 Development & Deployment
 * Description: Provides a standardized testing configuration for backend unit and integration tests.
 */

import type { Config } from 'jest';

const jestConfig: Config = {
  // Use ts-jest for TypeScript files
  preset: 'ts-jest',

  // Set Node.js as the test environment
  testEnvironment: 'node',

  // File extensions to consider for tests
  moduleFileExtensions: ['ts', 'js', 'json'],

  // Root directory for tests
  rootDir: './src',

  // Pattern to detect test files
  testRegex: '.*\\.test\\.ts$',

  // Coverage configuration
  coverageDirectory: './coverage',
  collectCoverageFrom: [
    '**/*.{ts,js}',
    '!**/node_modules/**',
    '!**/dist/**'
  ],

  // Path mappings that match tsconfig.json
  moduleNameMapper: {
    '^@utils/(.*)$': '<rootDir>/utils/$1',
    '^@config/(.*)$': '<rootDir>/config/$1',
    '^@services/(.*)$': '<rootDir>/services/$1'
  },

  // Additional Jest configurations
  verbose: true,
  testTimeout: 30000,
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },

  // Test environment configuration
  globals: {
    'ts-jest': {
      tsconfig: './tsconfig.json',
      diagnostics: {
        warnOnly: true
      }
    }
  }
};

export default jestConfig;