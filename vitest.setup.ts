// Registers the jest-dom matchers (`toBeInTheDocument`, `toHaveTextContent`, …)
// for component tests that run under the jsdom environment. The matchers are
// harmless to load for Node-environment tests that never touch the DOM.
import "@testing-library/jest-dom/vitest";
