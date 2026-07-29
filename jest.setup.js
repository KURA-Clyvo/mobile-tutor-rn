jest.mock('react-native-safe-area-context', () => {
  const mod = require('react-native-safe-area-context/jest/mock');
  return mod.default ?? mod;
});

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem:      jest.fn(() => Promise.resolve(null)),
  setItem:      jest.fn(() => Promise.resolve()),
  removeItem:   jest.fn(() => Promise.resolve()),
  multiSet:     jest.fn(() => Promise.resolve()),
  multiGet:     jest.fn(() => Promise.resolve([])),
  multiRemove:  jest.fn(() => Promise.resolve()),
  clear:        jest.fn(() => Promise.resolve()),
  getAllKeys:    jest.fn(() => Promise.resolve([])),
  mergeItem:    jest.fn(() => Promise.resolve()),
  flushGetRequests: jest.fn(),
}));
