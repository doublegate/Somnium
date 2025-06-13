export default {
  testEnvironment: 'jsdom',
  setupFiles: ['jest-canvas-mock'],
  moduleFileExtensions: ['js', 'mjs'],
  transform: {
    '^.+\\.m?js$': 'babel-jest',
  },
  testMatch: [
    '<rootDir>/js/**/*.test.js',
    '<rootDir>/tests/**/*.test.js',
  ],
  collectCoverageFrom: [
    'js/**/*.js',
    '!js/config.js',
    '!js/**/*.test.js',
    '!**/node_modules/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/js/$1',
  },
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
  ],
  globals: {
    'API_CONFIG': {
      apiKey: 'test-key',
      apiEndpoint: 'http://test.api',
      model: 'test-model'
    }
  },
  verbose: true,
  testTimeout: 10000,
};