import { expect } from "chai";
import { shallowMount } from "@vue/test-utils";
import App from "../src/App";

// Mock the rpc object with the required methods
const mockRpc = {
  invoke: async () => ({}),
  registerMethod: async () => {},
};

// Mock the WebSocket globally
globalThis.WebSocket = class {
  constructor(url) {
    this.url = url;
    this.listeners = {};
  }

  addEventListener(event, callback) {
    this.listeners[event] = callback;
  }

  // Simulate opening the connection
  open() {
    this.listeners["open"]();
  }
};

describe("App.vue", () => {
  it("renders without errors", () => {
    // Mount the component with the mocked rpc object and target prop
    const wrapper = shallowMount(App, {
      global: {
        stubs: ["v-app"],
      },
      data() {
        return {
          rpc: mockRpc, // Provide the mock rpc object
        };
      },
    });

    // Assert that the component exists without errors
    expect(wrapper.exists()).to.be.true;
  });

  it("renders the correct HTML structure", () => {
    const wrapper = shallowMount(App, {
      global: {
        stubs: ["v-app"],
      },
      data() {
        return {
          rpc: mockRpc, // Provide the mock rpc object
        };
      },
    });
    const expectedHtml = `<v-app-stubid="app"></v-app-stub>`;
    expect(wrapper.html().replace(/\s/g, "")).to.equal(expectedHtml);
  });
});
