export default {
  testEnvironment: 'node',
  testMatch: ['**/src/__tests__/**/*.test.js'],
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  setupFiles: ['<rootDir>/src/__tests__/setup.js'],
};
