import "@testing-library/jest-dom"; // If you're using Vue Test Utils with Vue 3

// Mock window.matchMedia
window.matchMedia = jest.fn().mockImplementation((query) => {
  return {
    matches: query === "(min-width: 768px)", // Adjust as needed
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
  };
});
