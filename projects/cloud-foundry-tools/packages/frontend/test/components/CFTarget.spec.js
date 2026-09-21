import CFTarget from "../../src/components/CFTarget.vue";
import { expect } from "chai";
import { shallowMount } from "@vue/test-utils";

jest.spyOn(window, "getComputedStyle").mockImplementation(() => ({
  getPropertyValue: (property) => {
    if (property === "--vscode-descriptionForeground") {
      return "#717171"; // Mock the CSS variable value
    }
    return "";
  },
}));

// Stub is used to avoid console warnings of vscode custom elements
const global = {
  stubs: {
    VscodeDivider: {
      template: "<div></div>",
    },
    VscodeOption: {
      template: "<div></div>",
    },
    VscodeButton: {
      template: "<button></button>",
    },
    VscodeSingleSelect: {
      template: "<div></div>",
    },
  },
};

describe("CFTarget.vue", () => {
  it("renders without errors", () => {
    const wrapper = shallowMount(CFTarget, {
      props: {
        target: {
          currentOrg: "ExampleOrg",
        },
        rpc: {},
        isLoggedIn: true, // Provide isLoggedIn value as needed
      },
      global,
    });
    expect(wrapper.exists()).to.be.true;
  });

  it("invokes setTarget method on Apply button click", async () => {
    const rpcMock = {
      invoke: jest.fn().mockResolvedValue(), // Mock the applyTarget method
    };
    //avoid showing warning for custom element in console log.
    jest.spyOn(console, "warn").mockImplementation(() => {
      return;
    });

    const wrapper = shallowMount(CFTarget, {
      props: {
        target: {
          currentOrg: "ExampleOrg",
        },
        rpc: rpcMock,
        isLoggedIn: true,
      },
      global: {
        stubs: {
          VscodeDivider: {
            template: "<div></div>",
          },
          VscodeOption: {
            template: "<div></div>",
          },
          VscodeDropdown: {
            template: "<div></div>",
          },
        },
      },
    });

    // Simulate selecting an organization and space
    wrapper.setData({
      selectedOrg: { label: "Org Label" },
      selectedSpace: { label: "Space Label" },
    });

    // Simulate clicking the "Apply" button
    await wrapper.find("vscode-button").trigger("click");

    // Add more assertions for component state updates
    expect(wrapper.vm.areOrgAndSpaceSet).to.be.true; // Ensure it's set to true
    expect(wrapper.vm.currentOrg).to.equal("Org Label"); // Ensure it's updated with the selected organization
    expect(wrapper.vm.currentSpace).to.equal("Space Label"); // Ensure it's updated with the selected space
  });

  it("displays certain elements when logged in", () => {
    const wrapper = shallowMount(CFTarget, {
      props: {
        target: {
          currentOrg: "ExampleOrg",
        },
        rpc: {},
        isLoggedIn: true, // Logged in
      },
      global,
    });

    // Assert that certain elements are visible
    expect(wrapper.find(".cloud-foundry-target").isVisible()).to.be.true;
    expect(wrapper.vm.loggedInVisibility).to.equal("");
  });

  it("hides certain elements when not logged in", () => {
    const wrapper = shallowMount(CFTarget, {
      props: {
        target: {},
        rpc: {},
        isLoggedIn: false, // Simulate not being logged in
      },
      global,
    });

    // Assert that certain elements are hidden
    expect(wrapper.vm.orgAndSpaceSetVisibility).to.equal("none");
    expect(wrapper.vm.loggedInVisibility).to.equal("none");
  });

  it("populates organization dropdown", async () => {
    const wrapper = shallowMount(CFTarget, {
      props: {
        target: {
          currentOrg: "ExampleOrg",
        },
        rpc: {
          invoke: jest.fn().mockResolvedValue([]), // Mock the getOrgs and getSpaces methods
        },
        isLoggedIn: true,
      },
      global,
    });

    // Wait for Vue to update the component
    await wrapper.vm.$nextTick();

    // Assert that the organization dropdown is populated correctly
    const orgDropdown = wrapper.find(".cf-drop-down"); // Adjust the selector as needed
    expect(orgDropdown.exists()).to.be.true;
  });

  it("populates space dropdown when an organization is selected", async () => {
    const wrapper = shallowMount(CFTarget, {
      props: {
        target: {
          currentOrg: "ExampleOrg",
        },
        rpc: {
          invoke: jest.fn().mockResolvedValue([]), // Mock the getOrgs and getSpaces methods
        },
        isLoggedIn: true,
      },
      global,
    });

    // Wait for Vue to update the component
    await wrapper.vm.$nextTick();

    // Simulate selecting an organization
    await wrapper.setData({ selectedOrg: { guid: "org-guid", label: "Org Label" } });

    // Wait for Vue to update the component
    await wrapper.vm.$nextTick();

    // Assert that the space dropdown is populated correctly
    const spaceDropdown = wrapper.find(".cf-drop-down"); // Adjust the selector as needed
    expect(spaceDropdown.exists()).to.be.true;
  });

  it("populates organization and space dropdowns", async () => {
    const rpcMock = {
      invoke: jest.fn().mockResolvedValue([]), // Mock the getOrgs and getSpaces methods
    };

    const wrapper = shallowMount(CFTarget, {
      props: {
        target: {
          currentOrg: "ExampleOrg",
        },
        rpc: rpcMock,
        isLoggedIn: true,
      },
      global,
    });

    // Wait for Vue to update the component
    await wrapper.vm.$nextTick();

    // Assert that the organization and space dropdowns are populated correctly
    const orgDropdown = wrapper.find(".cf-drop-down"); // Adjust the selector as needed
    const spaceDropdown = wrapper.findAll(".cf-drop-down"); // Adjust the selector as needed
    expect(orgDropdown.exists()).to.be.true;
    expect(spaceDropdown.length).to.equal(2); // You may need to adjust this based on your component's structure
  });

  it("sets currentOrg and currentSpace to undefined when target is undefined", async () => {
    const wrapper = shallowMount(CFTarget, {
      props: {
        target: undefined,
        rpc: {
          invoke: jest.fn().mockResolvedValue([]), // Mock the getOrgs and getSpaces methods
        },
        isLoggedIn: true,
      },
      global,
    });
    await wrapper.vm.$nextTick();

    // Trigger watch by changing isLoggedIn prop
    await wrapper.setProps({ currentOrg: "", currentSpace: "" });

    //   // Wait for Vue to update the component
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.currentOrg).to.equal(undefined);
    expect(wrapper.vm.currentSpace).to.equal(undefined);
  });

  it("does select Organizaion when Organizaion is returned from selectedTarget", async () => {
    const rpcMock = {
      invoke: jest.fn().mockImplementation((funcName) => {
        if (funcName === "getOrgs") {
          return Promise.resolve([
            { guid: "47423742", label: "bbbb" },
            { guid: "32432423", label: "aaaaa" },
          ]);
        } else if (funcName === "getSelectedTarget") {
          return Promise.resolve({ guid: "32432423", org: "aaaaa" });
        } else if (funcName === "getSpaces") {
          return Promise.resolve([]);
        }
      }),
    };

    const wrapper = shallowMount(CFTarget, {
      props: {
        target: {
          currentOrg: "aaaaa",
        },
        rpc: rpcMock,
        isLoggedIn: false,
      },
      global,
    });

    // Trigger watch by changing isLoggedIn prop
    await wrapper.setProps({ isLoggedIn: true });

    // Wait for Vue to update the component
    await wrapper.vm.$nextTick();

    // Assert orgs got sorted
    const orgsList = wrapper.vm.$data.orgs;
    expect(orgsList[0]?.label).equal("aaaaa");
    expect(orgsList[1]?.label).equal("bbbb");
    expect(wrapper.vm.selectedOrg).to.deep.equal({ label: "aaaaa", guid: "32432423", selected: true });
  });

  it("does not select Organizaion when multiple Organizaions returned and unknown Organizaion from selectedTarget", async () => {
    const rpcMock = {
      invoke: jest.fn().mockImplementation((funcName) => {
        if (funcName === "getOrgs") {
          return Promise.resolve([
            { guid: "47423742", label: "bbbb" },
            { guid: "32432423", label: "aaaaa" },
          ]);
        } else if (funcName === "getSelectedTarget") {
          return Promise.resolve({ guid: "00000000", org: "cccccc" });
        } else if (funcName === "getSpaces") {
          return Promise.resolve([
            {
              label: "space1",
              guid: "xxxxxxxx",
              orgGUID: "32432423",
            },
            {
              label: "space2",
              guid: "yyyyyyyy",
              orgGUID: "47423742",
            },
          ]);
        }
      }),
    };

    const wrapper = shallowMount(CFTarget, {
      props: {
        target: {
          currentOrg: "aaaaa",
        },
        rpc: rpcMock,
        isLoggedIn: false,
      },
      global,
    });

    // Trigger watch by changing isLoggedIn prop
    await wrapper.setProps({ isLoggedIn: true });

    // Wait for Vue to update the component
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.selectedOrg).to.deep.equal({});
    expect(wrapper.vm.selectedSpace).to.deep.equal({});
  });

  it("does select Organizaion and no Space when one Organizaion is returned but multiple Spaces and unknown org from selectedTarget", async () => {
    const rpcMock = {
      invoke: jest.fn().mockImplementation((funcName) => {
        if (funcName === "getOrgs") {
          return Promise.resolve([{ guid: "32432423", label: "aaaaa" }]);
        } else if (funcName === "getSelectedTarget") {
          return Promise.resolve({ guid: "00000000", org: "cccccc" });
        } else if (funcName === "getSpaces") {
          return Promise.resolve([
            {
              label: "space1",
              guid: "xxxxxxxx",
              orgGUID: "32432423",
            },
            {
              label: "space2",
              guid: "yyyyyyyy",
              orgGUID: "47423742",
            },
          ]);
        }
      }),
    };

    const wrapper = shallowMount(CFTarget, {
      props: {
        target: {
          currentOrg: "aaaaa",
        },
        rpc: rpcMock,
        isLoggedIn: false,
      },
      global,
    });

    // Trigger watch by changing isLoggedIn prop
    await wrapper.setProps({ isLoggedIn: true });

    // Wait for Vue to update the component
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.selectedOrg).to.deep.equal({ label: "aaaaa", guid: "32432423" });
    expect(wrapper.vm.selectedSpace).to.deep.equal({});
  });

  it("does select Organisaion and Space when one Organisation and one Space and unknown org from selectedTarget", async () => {
    const rpcMock = {
      invoke: jest.fn().mockImplementation((funcName) => {
        if (funcName === "getOrgs") {
          return Promise.resolve([{ guid: "32432423", label: "aaaaa" }]);
        } else if (funcName === "getSelectedTarget") {
          return Promise.resolve({ guid: "00000000", org: "cccccc" });
        } else if (funcName === "getSpaces") {
          return Promise.resolve([
            {
              label: "space1",
              guid: "xxxxxxxx",
              orgGUID: "32432423",
            },
          ]);
        }
      }),
    };

    const wrapper = shallowMount(CFTarget, {
      props: {
        target: {
          currentOrg: "aaaaa",
        },
        rpc: rpcMock,
        isLoggedIn: false,
      },
      global,
    });

    // Trigger watch by changing isLoggedIn prop
    await wrapper.setProps({ isLoggedIn: true });

    // Wait for Vue to update the component
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.selectedOrg).to.deep.equal({ label: "aaaaa", guid: "32432423" });
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.selectedSpace).to.deep.equal({ guid: "xxxxxxxx", label: "space1", selected: false });
  });

  it("does select Organisaion and Space when one Organisation and multiple Space and known org from selectedTarget", async () => {
    const rpcMock = {
      invoke: jest.fn().mockImplementation((funcName) => {
        if (funcName === "getOrgs") {
          return Promise.resolve([{ guid: "32432423", label: "aaaaa" }]);
        } else if (funcName === "getSelectedTarget") {
          return Promise.resolve({ guid: "32432423", org: "aaaaa", space: "space1" });
        } else if (funcName === "getSpaces") {
          return Promise.resolve([
            {
              label: "space1",
              guid: "xxxxxxxx",
              orgGUID: "32432423",
            },
            {
              label: "space2",
              guid: "xxxxxxxx",
              orgGUID: "32432423",
            },
          ]);
        }
      }),
    };

    const wrapper = shallowMount(CFTarget, {
      props: {
        target: {
          currentOrg: "aaaaa",
        },
        rpc: rpcMock,
        isLoggedIn: false,
      },
      global,
    });

    // Trigger watch by changing isLoggedIn prop
    await wrapper.setProps({ isLoggedIn: true });

    // Wait for Vue to update the component
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.selectedOrg).to.deep.equal({ label: "aaaaa", guid: "32432423", selected: true });
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.selectedSpace).to.deep.equal({ guid: "xxxxxxxx", label: "space1", selected: true });
  });

  it("does show error message when no Organisations are returned", async () => {
    const rpcMock = {
      invoke: jest.fn().mockImplementation((funcName) => {
        if (funcName === "getOrgs") {
          return Promise.resolve([]);
        } else if (funcName === "getSelectedTarget") {
          return Promise.resolve({ guid: "00000000", org: "cccccc" });
        } else if (funcName === "getSpaces") {
          return Promise.resolve([]);
        }
      }),
    };

    const wrapper = shallowMount(CFTarget, {
      props: {
        target: {
          currentOrg: "aaaaa",
        },
        rpc: rpcMock,
        isLoggedIn: false,
      },
      global,
    });

    await wrapper.setData({
      orgMissing: true,
    });

    // Trigger watch by changing isLoggedIn prop
    await wrapper.setProps({ isLoggedIn: true });

    // Wait for Vue to update the component
    await wrapper.vm.$nextTick();

    // Trigger watch by changing isLoggedIn prop
    expect(wrapper.vm.selectedOrg).to.deep.equal({});
    expect(wrapper.vm.selectedSpace).to.deep.equal({});
    expect(wrapper.text()).contain("There is no Org defined for this landscape.");
  });

  it("does show error message when there is Organisaion but no Spaces are returned", async () => {
    const rpcMock = {
      invoke: jest.fn().mockImplementation((funcName) => {
        if (funcName === "getOrgs") {
          return Promise.resolve([{ guid: "32432423", label: "aaaaa" }]);
        } else if (funcName === "getSelectedTarget") {
          return Promise.resolve({ guid: "00000000", org: "cccccc" });
        } else if (funcName === "getSpaces") {
          return Promise.resolve([]);
        }
      }),
    };

    const wrapper = shallowMount(CFTarget, {
      props: {
        target: {
          currentOrg: "aaaaa",
        },
        rpc: rpcMock,
        isLoggedIn: false,
      },
      global,
    });

    await wrapper.setData({
      spaceMissing: true,
    });

    // Trigger watch by changing isLoggedIn prop
    await wrapper.setProps({ isLoggedIn: true });

    // Wait for Vue to update the component
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.selectedOrg).to.deep.equal({ label: "aaaaa", guid: "32432423" });
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.selectedSpace).to.deep.equal({});
    expect(wrapper.text()).contain("There is no Space defined for the org you selected.");
  });

  it("updates selectedOrg when an organization is selected", async () => {
    const wrapper = shallowMount(CFTarget, {
      props: {
        target: {
          currentOrg: "ExampleOrg", // Set your desired currentOrg value
          currentSpace: "ExampleSpace", // Set your desired currentSpace value
        },
        rpc: {},
        isLoggedIn: true,
      },
      global,
    });

    // Wait for Vue to update the component
    await wrapper.vm.$nextTick();

    // Simulate selecting an organization
    await wrapper.setData({ selectedOrg: { guid: "org-guid", label: "Org Label" } });

    // Assert that selectedOrg is updated correctly
    expect(wrapper.vm.selectedOrg).to.deep.equal({ guid: "org-guid", label: "Org Label" });
  });

  it("selects a space when an organization is selected", async () => {
    // Mock the RPC object with a custom implementation for getSpaces
    const rpcMock = {
      invoke: jest.fn((method, args) => {
        if (method === "getSpaces" && args[0] === "org-guid") {
          return Promise.resolve([
            { guid: "space-guid-1", label: "Space 1" },
            { guid: "space-guid-2", label: "Space 2" },
          ]);
        }
        return Promise.resolve([]);
      }),
    };

    const wrapper = shallowMount(CFTarget, {
      props: {
        target: {
          currentOrg: "ExampleOrg",
        },
        rpc: rpcMock,
        isLoggedIn: true,
      },
      global,
    });

    // Wait for Vue to update the component
    await wrapper.vm.$nextTick();

    // Simulate selecting an organization
    await wrapper.setData({ selectedOrg: { guid: "org-guid", label: "Org Label" } });

    // Wait for Vue to update the component
    await wrapper.vm.$nextTick();

    // Assert that the space dropdown is populated correctly
    const spaceDropdown = wrapper.find(".cf-drop-down");
    expect(spaceDropdown.exists()).to.be.true;

    // Simulate selecting a space
    await wrapper.setData({ selectedSpace: { guid: "space-guid-1", label: "Space 1" } });

    // Assert that selectedSpace is updated correctly
    expect(wrapper.vm.selectedSpace).to.deep.equal({ guid: "space-guid-1", label: "Space 1" });
  });

  it("update selectedOrg and clears selected space when Organization is changed", async () => {
    const rpcMock = {
      invoke: jest.fn().mockImplementation((funcName) => {
        if (funcName === "getOrgs") {
          return Promise.resolve([
            { guid: "32432423", label: "aaaaa" },
            { guid: "47423742", label: "bbbb" },
          ]);
        } else if (funcName === "getSelectedTarget") {
          return Promise.resolve({ guid: "00000000", org: "cccccc" });
        } else if (funcName === "getSpaces") {
          return Promise.resolve([
            {
              label: "space1",
              guid: "xxxxxxxx",
              orgGUID: "32432423",
            },
          ]);
        }
      }),
    };

    const wrapper = shallowMount(CFTarget, {
      props: {
        target: {
          currentOrg: "aaaaa",
        },
        rpc: rpcMock,
        isLoggedIn: false,
      },
      global,
    });

    // Trigger watch by changing isLoggedIn prop
    await wrapper.setProps({ isLoggedIn: true });

    // Wait for Vue to update the component
    await wrapper.vm.$nextTick();

    wrapper.vm.updateSelectedOrg({ target: { value: "bbbb" } });

    expect(wrapper.vm.selectedOrg).to.deep.equal({ guid: "47423742", label: "bbbb", selected: false });
    expect(wrapper.vm.selectedSpace).to.deep.equal({});
  });

  it("update selectedSpace when new space is passed", async () => {
    const rpcMock = {
      invoke: jest.fn().mockImplementation((funcName) => {
        if (funcName === "getOrgs") {
          return Promise.resolve([{ guid: "32432423", label: "aaaaa" }]);
        } else if (funcName === "getSelectedTarget") {
          return Promise.resolve({ guid: "00000000", org: "cccccc" });
        } else if (funcName === "getSpaces") {
          return Promise.resolve([]);
        }
      }),
    };

    const wrapper = shallowMount(CFTarget, {
      props: {
        target: {
          currentOrg: "aaaaa",
        },
        rpc: rpcMock,
        isLoggedIn: false,
      },
      global,
    });

    await wrapper.setData({
      spaces: [
        {
          label: "space1",
          guid: "xxxxxxxx",
          orgGUID: "32432423",
          selected: true,
        },
        {
          label: "space2",
          guid: "yyyyyyyy",
          orgGUID: "47423742",
        },
      ],
    });
    // Trigger watch by changing isLoggedIn prop
    await wrapper.setProps({ isLoggedIn: true });

    // Wait for Vue to update the component
    await wrapper.vm.$nextTick();

    wrapper.vm.updateSelectedSpace({ target: { value: "space2" } });

    expect(wrapper.vm.selectedSpace).to.deep.equal({ guid: "yyyyyyyy", label: "space2", orgGUID: "47423742" });
  });
});
