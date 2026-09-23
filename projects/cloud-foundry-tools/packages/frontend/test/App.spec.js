import { expect } from "chai";
import { shallowMount } from "@vue/test-utils";
import App from "../src/App";

jest.mock("@sap-devx/webview-rpc/out.browser/rpc-browser", () => ({
  RpcBrowser: jest.fn().mockImplementation(() => ({
    invoke: jest.fn(),
    registerMethod: jest.fn(),
  })),
}));

// Mock RpcBrowserWebSockets class
jest.mock("@sap-devx/webview-rpc/out.browser/rpc-browser-ws", () => {
  class MockRpcBrowserWebSockets {
    constructor(ws, logger) {
      this.ws = ws;
      this.logger = logger;
      this.eventListeners = {};

      // Simulate the behavior of the real constructor
      this.ws.addEventListener = (eventName, callback) => {
        this.eventListeners[eventName] = callback;
      };

      // Initialize an empty invoke method
      this.invoke = jest.fn();
    }

    registerMethod() {}
  }

  return {
    RpcBrowserWebSockets: MockRpcBrowserWebSockets,
  };
});

jest.mock("../src/components/CFHeader.vue", () => ({
  name: "CFHeader",
  template: "<div>Mocked CFHeader</div>", // Replace with your desired mock template
}));

// Mock the CFSignin.vue module
jest.mock("../src/components/CFSignin.vue", () => ({
  name: "CFSignin",
  template: "<div>Mocked CFSignin</div>", // Replace with your desired mock template
}));

// Stub is used to avoid console warnings of vscode custom elements
const global = {
  stubs: {
    VscodeProgressRing: {
      template: "<div></div>",
    },
  },
};

describe("App.vue", () => {
  // Mock the rpc object with the required methods
  const mockRpc = {
    invoke: jest.fn(() => Promise.resolve({})),
    registerMethod: jest.fn(),
  };

  it("renders without errors", () => {
    // Mount the component with the mocked rpc object and target prop
    const wrapper = shallowMount(App, {
      data() {
        return {
          rpc: mockRpc, // Provide the mock rpc object
          initialTarget: {},
        };
      },
      global,
    });

    // Assert that the component exists without errors
    expect(wrapper.exists()).to.be.true;
  });

  it("updates isLoggedIn when updateIsLoggedIn is called", () => {
    const wrapper = shallowMount(App, {
      data() {
        return {
          rpc: mockRpc, // Provide the mock rpc object
          initialTarget: {},
        };
      },
      global,
    });
    expect(wrapper.vm.isLoggedIn).to.be.false; // Initial state

    // Call the updateIsLoggedIn method with a value of true
    wrapper.vm.updateIsLoggedIn(true);

    // Check that isLoggedIn has been updated to true
    expect(wrapper.vm.isLoggedIn).to.be.true;
  });

  it("updates orgAndSpaceSet when updateOrgAndSpaceSet is called", () => {
    const wrapper = shallowMount(App, {
      data() {
        return {
          rpc: mockRpc, // Provide the mock rpc object
          initialTarget: {},
        };
      },
      global,
    });
    expect(wrapper.vm.orgAndSpaceSet).to.be.false; // Initial state

    // Call the updateOrgAndSpaceSet method with a value of true
    wrapper.vm.updateOrgAndSpaceSet(true);

    // Check that isLoggedIn has been updated to true
    expect(wrapper.vm.orgAndSpaceSet).to.be.true;
  });

  it("renders the correct HTML structure", () => {
    const wrapper = shallowMount(App, {
      data() {
        return {
          rpc: mockRpc, // Provide the mock rpc object
          initialTarget: {},
        };
      },
      global,
    });
    const expectedHtml = `<divid="app"><c-f-header-stubclass="app"></c-f-header-stub><divclass="progress-ring"style="display:none;"></div><divclass="app"><divstyle="visibility:none;"><c-f-signin-stubtarget="[objectObject]"organdspaceset="false"rpc="[objectObject]"></c-f-signin-stub><divstyle="display:none;"><c-f-target-stubtarget="[objectObject]"rpc="[objectObject]"isloggedin="false"></c-f-target-stub></div></div></div><!--endprogress--></div>`;
    expect(wrapper.html().replace(/\s/g, "")).to.equal(expectedHtml);
  });

  it("computes isLoadingColor as true", () => {
    const wrapper = shallowMount(App, {
      data() {
        return {
          rpc: mockRpc, // Provide the mock rpc object
          initialTarget: {},
        };
      },
      global,
    });

    // Check that the computed property returns true
    expect(wrapper.vm.isLoadingColor).to.be.true;
  });

  it("sets showBusyIndicator to the specified value", () => {
    const wrapper = shallowMount(App, {
      data() {
        return {
          rpc: mockRpc, // Provide the mock rpc object
          showBusyIndicator: false, // Initialize with a specific value
          initialTarget: {},
        };
      },
      global,
    });

    // Call the setBusyIndicator method with a value of true
    wrapper.vm.setBusyIndicator(true);

    // Check that the showBusyIndicator data property is now true
    expect(wrapper.vm.showBusyIndicator).to.be.true;
  });

  it("sets showBusyIndicator to the specified value (false)", () => {
    const wrapper = shallowMount(App, {
      data() {
        return {
          rpc: mockRpc, // Provide the mock rpc object
          showBusyIndicator: true, // Initialize with a specific value
          initialTarget: {},
        };
      },
      global,
    });

    // Call the setBusyIndicator method with a value of false
    wrapper.vm.setBusyIndicator(false);

    // Check that the showBusyIndicator data property is now false
    expect(wrapper.vm.showBusyIndicator).to.be.false;
  });
});
