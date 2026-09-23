import Editor from "../../src/components/Editor.vue";
import { expect } from "chai";
import { mount } from "@vue/test-utils";

describe("Editor.vue", () => {
  it("renders without errors", () => {
    const wrapper = mount(Editor, {
      global: {
        stubs: [
          "v-card",
          "v-main",
          "v-img",
          "v-row",
          "v-card-title",
          "v-btn",
          "v-spacer",
          "v-spacer",
          "v-col",
          "v-list",
          "Form",
          "v-list-item",
          "v-list-item-title",
          "v-icon",
          "v-divider",
        ],
      },
    });
    expect(wrapper.exists()).to.be.true;
  });

  it("renders the correct HTML structure set editor false", () => {
    const wrapper = mount(Editor, {
      global: {
        stubs: [
          "v-card",
          "v-main",
          "v-img",
          "v-row",
          "v-card-title",
          "v-btn",
          "v-spacer",
          "v-spacer",
          "v-col",
          "v-list",
          "Form",
          "v-list-item",
          "v-list-item-title",
          "v-icon",
          "v-divider",
        ],
      },
    });
    const expectedHtml = `<!--v-if-->`;
    expect(wrapper.html().replace(/\s/g, "")).to.equal(expectedHtml);
  });

  it("renders the correct HTML structure set editor true", () => {
    const wrapper = mount(Editor, {
      global: {
        stubs: [
          "v-card",
          "v-main",
          "v-img",
          "v-row",
          "v-card-title",
          "v-btn",
          "v-spacer",
          "v-spacer",
          "v-col",
          "v-list",
          "Form",
          "v-list-item",
          "v-list-item-title",
          "v-icon",
          "v-divider",
        ],
      },
      props: {
        editor: true,
        rpc: {},
      },
    });
    const expectedHtml = `<v-main-stubid="editor-component"></v-main-stub>`;
    expect(wrapper.html().replace(/\s/g, "")).to.equal(expectedHtml);
    expect(wrapper.exists()).to.be.true;
  });

  it("correctly handles 'onAnswered' method", async () => {
    // Mount the component
    const wrapper = mount(Editor, {
      global: {
        stubs: [
          "v-card",
          "v-main",
          "v-img",
          "v-row",
          "v-card-title",
          "v-btn",
          "v-spacer",
          "v-spacer",
          "v-col",
          "v-list",
          "Form",
          "v-list-item",
          "v-list-item-title",
          "v-icon",
          "v-divider",
        ],
      },
      props: {
        editor: true,
        rpc: {}, // Provide any required props here
      },
    });

    // Define initial state for testing
    wrapper.setData({
      state: {
        inputValid: true,
        saveEnabled: true,
        firstRender: true,
      },
    });

    // Create sample data for the 'answers' and 'issues' parameters
    const sampleAnswers = { label: "Sample Label" };
    const sampleIssues = undefined;

    // Call the 'onAnswered' method with the sample data
    await wrapper.vm.onAnswered(sampleAnswers, sampleIssues);

    // Assert that the 'state' properties have been updated correctly
    expect(wrapper.vm.state.inputValid).to.equal(true);
    expect(wrapper.vm.state.saveEnabled).to.equal(false);
    expect(wrapper.vm.state.firstRender).to.equal(false);
  });

  it("correctly handles 'onSave' method", async () => {
    // Mount the component
    const wrapper = mount(Editor, {
      global: {
        stubs: [
          "v-card",
          "v-main",
          "v-img",
          "v-row",
          "v-card-title",
          "v-btn",
          "v-spacer",
          "v-spacer",
          "v-col",
          "v-list",
          "Form",
          "v-list-item",
          "v-list-item-title",
          "v-icon",
          "v-divider",
        ],
      },
      props: {
        editor: true,
        rpc: {},
      },
    });

    // Mock the 'rpc' object and its 'invoke' method
    const mockRpc = {
      invoke: async () => {},
    };

    // Set the 'rpc' object in the component's data
    wrapper.setData({
      rpc: mockRpc,
      state: {
        saveEnabled: true,
      },
    });

    // Call the 'onSave' method
    await wrapper.vm.onSave();

    // Assert that the 'saveEnabled' state has been correctly updated
    expect(wrapper.vm.state.saveEnabled).to.be.false;
  });
});
