// This file is used to set up the test environment
// It runs before each test file

// Mock console methods to keep test output clean
global.console = {
  ...console,
  // Uncomment to suppress specific console methods during tests
  // log: jest.fn(),
  // error: jest.fn(),
  // warn: jest.fn(),
  // info: jest.fn(),
  // debug: jest.fn(),
};

// Add any global test setup here
beforeAll(() => {
  // Setup code that runs once before all tests
});

afterAll(() => {
  // Cleanup code that runs once after all tests
});

// Reset all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});
