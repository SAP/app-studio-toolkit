import { expect } from "chai";
import { shallowMount } from "@vue/test-utils";
import CFSignin from "../../src/components/CFSignin.vue";

const mockTooltipDirective = jest.fn();

const global = {
  directives: {
    // Use the mockTooltipDirective for v-tooltip
    tooltip: mockTooltipDirective,
  },
  stubs: {
    VscodeLink: {
      template: "<div></div>",
    },
    VscodeRadioGroup: {
      template: "<div></div>",
    },
    VscodeRadio: {
      template: "<button></button>",
    },
    VscodeTextfield: {
      template: "<div></div>",
    },
    VscodeButton: {
      template: "<button></button>",
    },
    VscodeIcon: {
      template: "<span></span>",
    },
  },
};

describe("CFSignin.vue", () => {
  it("renders without errors", () => {
    const wrapper = shallowMount(CFSignin, {
      global,
      props: {
        target: {},
        rpc: {},
        orgAndSpaceSet: false,
      },
    });
    expect(wrapper.exists()).to.be.true;
  });

  it("initializes with default data values", () => {
    const wrapper = shallowMount(CFSignin, {
      global,
      props: {
        target: {
          defaultEndpoint: "https://example.com",
          isLoggedIn: false,
        },
        rpc: {},
        orgAndSpaceSet: false,
      },
    });

    // Check initial data values
    expect(wrapper.vm.endpoint).to.equal("https://example.com");
    expect(wrapper.vm.passcode).to.equal("");
    expect(wrapper.vm.username).to.equal("");
    expect(wrapper.vm.password).to.equal("");
    expect(wrapper.vm.isCFEndpointValid).to.be.true;
    expect(wrapper.vm.disableButton).to.be.true;
  });

  it("disables the Sign in button when no input is provided", async () => {
    //avoid showing warning for custom element in console log.
    jest.spyOn(console, "warn").mockImplementation(() => {
      return;
    });

    const wrapper = shallowMount(CFSignin, {
      // Do not mock button
      global: {
        directives: {
          // Use the mockTooltipDirective for v-tooltip
          tooltip: mockTooltipDirective,
        },
        stubs: {
          VscodeLink: {
            template: "<div></div>",
          },
          VscodeRadioGroup: {
            template: "<div></div>",
          },
          VscodeRadio: {
            template: "<button></button>",
          },
          VscodeTextField: {
            template: "<div></div>",
          },
        },
      },
      props: {
        target: {
          defaultEndpoint: "",
          isLoggedIn: false,
        },
        rpc: {},
        orgAndSpaceSet: false,
      },
    });

    // Confirm that the Sign in button is initially not visible
    expect(wrapper.find("vscode-button").isVisible()).to.be.false;
  });

  it("handles successful sign-in with valid credentials", async () => {
    const wrapper = shallowMount(CFSignin, {
      global,
      props: {
        target: {
          defaultEndpoint: "https://example.com",
          isLoggedIn: false,
        },
        rpc: {
          invoke: jest.fn().mockResolvedValue(true), // Mock RPC to return success
        },
        orgAndSpaceSet: false,
      },
    });
    // Set endPoint to be the default one
    wrapper.vm.setEndpoint({ target: { value: "" } });

    // Set SSO target to be Credentials
    wrapper.vm.setSSO({ target: { value: "Credentials" } });

    // Set valid username and password or passcode
    wrapper.setData({ username: "validUsername", password: "validPassword" });

    const invokeSpy = jest.spyOn(wrapper.props().rpc, "invoke");

    // Trigger the SigninClicked method
    await wrapper.vm.SigninClicked();

    // Assert that authentication failed message is not displayed and isLoggedIn is set to true
    expect(wrapper.vm.authFailed).to.equal("");
    expect(wrapper.vm.isLoggedIn).to.be.true;
    // Check that loginClick was called with correct params
    expect(invokeSpy.mock.calls[0][0]).to.be.equals("loginClick");
    expect(invokeSpy.mock.calls[0][1][0]).to.deep.equal({
      endpoint: "https://example.com",
      user: "validUsername",
      password: "validPassword",
    });
  });

  it("handles successful sign-in with valid SSO", async () => {
    const endpoint = "https://example.com";
    const passcode = "-_validPasscode";
    const wrapper = shallowMount(CFSignin, {
      global,
      props: {
        target: {
          defaultEndpoint: endpoint,
          isLoggedIn: false,
        },
        rpc: {
          invoke: async (command, args) => {
            expect(command).to.equal("loginClick");
            expect(args[0]).to.deep.equal({
              endpoint: endpoint,
              ssoPasscode: `"${passcode}"`,
            });
            return true;
          },
        },
        orgAndSpaceSet: false,
      },
    });

    // Set SSO authentication method
    wrapper.vm.setSSO({ target: { value: "SSO" } });

    wrapper.vm.passcode = passcode;

    // Trigger the SigninClicked method
    await wrapper.vm.SigninClicked();

    // Assert that authentication failed message is not displayed and isLoggedIn is set to true
    expect(wrapper.vm.authFailed).to.equal("");
    expect(wrapper.vm.isLoggedIn).to.be.true;
  });

  it("handles unsuccessful sign-in with invalid credentials", async () => {
    const wrapper = shallowMount(CFSignin, {
      global,
      props: {
        target: {
          defaultEndpoint: "https://example.com",
          isLoggedIn: false,
        },
        rpc: {
          invoke: jest.fn().mockResolvedValue(false), // Mock RPC to return failure
        },
        orgAndSpaceSet: false,
      },
    });

    // Set invalid username and password or passcode
    wrapper.setData({ username: "invalidUsername", password: "invalidPassword" });

    // Trigger the SigninClicked method
    await wrapper.vm.SigninClicked();

    // Assert that authentication failed message is displayed and isLoggedIn remains false
    expect(wrapper.vm.authFailed).not.to.equal("");
    expect(wrapper.vm.isLoggedIn).to.be.false;
  });

  it("handles successful sign-out", async () => {
    const wrapper = shallowMount(CFSignin, {
      global,
      props: {
        target: {
          defaultEndpoint: "https://example.com",
          isLoggedIn: true,
        },
        rpc: {
          invoke: jest.fn().mockResolvedValue(true), // Mock RPC to return success
        },
        orgAndSpaceSet: false,
      },
    });

    // Trigger the SignoutClicked method
    await wrapper.vm.SignoutClicked();

    // Assert that isLoggedIn is set to false after sign-out
    expect(wrapper.vm.isLoggedIn).to.be.false;
  });

  it("sets SSO or Credentials authentication method", () => {
    const wrapper = shallowMount(CFSignin, {
      global,
      props: {
        target: {
          defaultEndpoint: "",
          isLoggedIn: false,
        },
        rpc: {},
        orgAndSpaceSet: false,
      },
    });

    // Assert that ssoOrCredentials is set to "SSO" by default
    expect(wrapper.vm.ssoOrCredentials).to.equal("SSO");

    // Set Credentials authentication method
    wrapper.vm.setSSO({ target: { value: "Credentials" } });

    // Assert that ssoOrCredentials is set to "Credentials"
    expect(wrapper.vm.ssoOrCredentials).to.equal("Credentials");
  });

  it("should set correct button state when conditions are met", async () => {
    const wrapper = shallowMount(CFSignin, {
      global,
      props: {
        target: {
          defaultEndpoint: "",
          isLoggedIn: false,
        },
        rpc: {},
        orgAndSpaceSet: false,
      },
    });

    // Set enabled credentials data
    await wrapper.setData({
      endpoint: "https://example.com", // Set a valid endpoint
      isCFEndpointValid: true,
      ssoOrCredentials: "Credentials",
      username: "user",
      password: "password",
    });

    // Trigger the btnStatus method
    await wrapper.vm.btnStatus();

    // Check that the button is enabled
    expect(wrapper.vm.disableButton).to.be.false;

    // Set enabled sso data
    await wrapper.setData({
      endpoint: "https://example.com", // Set a valid endpoint
      isCFEndpointValid: true,
      ssoOrCredentials: "SSO",
      passcode: "passcode",
    });

    // Trigger the btnStatus method
    await wrapper.vm.btnStatus();

    // Check that the button is enabled
    expect(wrapper.vm.disableButton).to.be.false;

    // Set disabled sso data
    await wrapper.setData({
      endpoint: "https://example.com", // Set a valid endpoint
      isCFEndpointValid: true,
      ssoOrCredentials: "SSO",
      passcode: "",
    });

    // Trigger the btnStatus method
    await wrapper.vm.btnStatus();

    // Check that the button is enabled
    expect(wrapper.vm.disableButton).to.be.true;
  });

  it("should disable the button when conditions are not met", async () => {
    const wrapper = shallowMount(CFSignin, {
      global,
      props: {
        target: {
          defaultEndpoint: "",
          isLoggedIn: false,
        },
        rpc: {},
        orgAndSpaceSet: false,
      },
    });

    // Set some initial values to trigger button disabling
    await wrapper.setData({
      endpoint: "", // Set an empty endpoint
      isCFEndpointValid: false,
      ssoOrCredentials: "Credentials",
      username: "",
      password: "",
    });

    // Trigger the btnStatus method
    await wrapper.vm.btnStatus();

    // Check that the button is disabled
    expect(wrapper.vm.disableButton).to.be.true;
  });

  it("should set CF endpoint and validate it", async () => {
    const wrapper = shallowMount(CFSignin, {
      global,
      props: {
        target: {
          defaultEndpoint: "",
          isLoggedIn: false,
        },
        rpc: {},
        orgAndSpaceSet: false,
      },
    });

    // Set a valid CF endpoint
    const validEndpoint = "https://example.com";
    await wrapper.vm.setEndpoint({ target: { value: validEndpoint } });

    // Check if endpoint is correctly set
    expect(wrapper.vm.endpoint).to.be.equals(validEndpoint);

    // Set an invalid CF endpoint
    const invalidEndpoint = "invalid-url";
    await wrapper.vm.setEndpoint({ target: { value: invalidEndpoint } });

    // Check if endpoint is correctly set
    expect(wrapper.vm.endpoint).to.be.equals(invalidEndpoint);
  });

  it("handles successful open passcode link", async () => {
    const wrapper = shallowMount(CFSignin, {
      global,
      props: {
        target: {
          defaultEndpoint: "https://example.com",
          isLoggedIn: true,
        },
        rpc: {
          invoke: jest.fn().mockResolvedValue(true), // Mock RPC to return success
        },
        orgAndSpaceSet: false,
      },
    });

    const invokeSpy = jest.spyOn(wrapper.props().rpc, "invoke");

    // Trigger the method that should call openPasscodeLink
    await wrapper.vm.openPasscodeLink();

    // Check that openPasscodeLink was called
    expect(invokeSpy.mock.calls[0][0]).to.be.equals("openPasscodeLink");
  });

  it("handles successful paste", async () => {
    // Mock the clipboard API
    navigator.clipboard = {
      readText: jest.fn().mockResolvedValue("mocked-passcode"),
    };

    const wrapper = shallowMount(CFSignin, {
      global,
      props: {
        target: {
          defaultEndpoint: "https://example.com",
          isLoggedIn: true,
        },
        rpc: {
          invoke: jest.fn().mockResolvedValue(true), // Mock RPC to return success
        },
        orgAndSpaceSet: false,
      },
    });

    // Trigger the paste method
    wrapper.vm.paste();

    // Assert the passcode is set correctly
    wrapper.vm.$nextTick(() => {
      expect(wrapper.vm.passcode).to.be.equals("mocked-passcode");
    });
  });
});
