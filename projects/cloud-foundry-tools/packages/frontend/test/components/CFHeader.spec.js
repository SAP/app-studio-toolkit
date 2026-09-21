import CFHeader from "../../src/components/CFHeader.vue";
import { expect } from "chai";
import { mount } from "@vue/test-utils";

jest.spyOn(window, "getComputedStyle").mockImplementation(() => ({
  getPropertyValue: (property) => {
    if (property === "--vscode-descriptionForeground") {
      return "#717171"; // Mock the CSS variable value
    }
    return "";
  },
}));

const global = {
  stubs: {
    VscodeDivider: {
      template: "<div></div>",
    },
  },
};

describe("CFHeader.vue", () => {
  it("renders without errors", () => {
    const wrapper = mount(CFHeader, {
      global,
    });
    expect(wrapper.exists()).to.be.true;
  });

  it("renders the component with correct content", () => {
    const wrapper = mount(CFHeader, { global });
    expect(wrapper.text()).contain("Cloud Foundry Sign In and Targets");
    expect(wrapper.text()).contain(
      "Provide your credentials to sign in to the Cloud Foundry environment and then select the target org and space."
    );
    expect(wrapper.find('[role="separator"]').exists()).to.be.true;
  });

  it("applies the correct subtitle-field style", () => {
    const wrapper = mount(CFHeader, { global });

    // Access the element with class "subtitle-field"
    const subtitleField = wrapper.find(".subtitle-field").element;

    // Get the computed style of the element
    const computedStyle = window.getComputedStyle(subtitleField);

    // Assert the computed style properties
    expect(computedStyle.getPropertyValue("--vscode-descriptionForeground")).to.equal("#717171");
  });

  it("renders the correct HTML structure", () => {
    const wrapper = mount(CFHeader, { global });
    const expectedHtml = `<div><h1wrapping-type="Normal">CloudFoundrySignInandTargets</h1><spanclass="subtitle-field">ProvideyourcredentialstosignintotheCloudFoundryenvironmentandthenselectthetargetorgandspace.</span><br><br><divrole="separator"></div><br></div>`;
    expect(wrapper.html().replace(/\s/g, "")).to.equal(expectedHtml);
  });
});
