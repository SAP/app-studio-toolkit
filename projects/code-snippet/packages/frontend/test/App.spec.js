import { initComponent, destroy } from "./Utils";
import App from "../src/App.vue";
import { expect } from "chai";
import { mount } from "@vue/test-utils";

global.WebSocket = jest.fn();

let wrapper;

describe("App.vue", () => {
  afterEach(() => {
    destroy(wrapper);
  });

  const stubs = [
    "v-loading",
    "Form",
    "v-col",
    "v-row",
    "v-divider",
    "v-btn",
    "v-footer",
    "v-card",
    "v-app",
    "v-loading",
  ];

  it("renders without errors", () => {
    const wrapper = mount(App, {
      global: {
        stubs: stubs,
      },
    });
    // Assert that the component exists without errors
    expect(wrapper.exists()).to.be.true;
  });

  it("renders the correct HTML structure", () => {
    const wrapper = mount(App, {
      global: {
        stubs: stubs,
      },
    });
    // Assert that the component exists without errors
    const expectedHtml = `<v-app-stubid="app"class="vld-parent"></v-app-stub>`;
    expect(wrapper.html().replace(/\s/g, "")).to.equal(expectedHtml);
  });

  it("createPrompt - method", () => {
    wrapper = initComponent(App, {}, true);
    expect(wrapper.vm.createPrompt().name).to.be.undefined;
    expect(wrapper.vm.createPrompt([]).name).to.be.undefined;
    expect(wrapper.vm.createPrompt([], "select_generator")).to.not.be.undefined;
  });

  describe("currentPrompt - computed", () => {
    it("questions are not defined", () => {
      wrapper = initComponent(App, {});
      wrapper.vm.prompts = [{}, {}];
      wrapper.vm.promptIndex = 1;
      expect(wrapper.vm.currentPrompt.answers).to.be.undefined;
    });
  });

  describe("showPrompt - method", () => {
    it("set props", async () => {
      wrapper = initComponent(App, {}, true);
      wrapper.vm.rpc = {
        invoke: jest.fn().mockImplementation((...args) => {
          return args[1][1];
        }),
      };
      const questions = [
        { name: "defaultQ", default: "__Function" },
        { name: "whenQ", when: "__Function" },
        { name: "messageQ", message: "__Function" },
        { name: "choicesQ", choices: "__Function" },
        { name: "filterQ", filter: "__Function" },
        { name: "validateQ", validate: "__Function" },
        { name: "whenQ6", default: "whenAnswer6", type: "confirm" },
      ];
      wrapper.vm.showPrompt(questions);
      await wrapper.vm.$nextTick();
      let response = await questions[0].default();
      expect(response).to.equal(questions[0].name);

      response = await questions[1].when();
      expect(response).to.equal(questions[1].name);

      response = await questions[2].message();
      expect(response).to.equal(questions[2].name);

      response = await questions[3].choices();
      expect(response).to.equal(questions[3].name);

      response = await questions[4].filter();
      expect(response).to.equal(questions[4].name);

      response = await questions[5].validate();
      expect(response).to.equal(questions[5].name);
    });

    // the delay ensures we call the busy indicator
    it("validate() with delay", async () => {
      wrapper = initComponent(App, {}, true);
      wrapper.vm.rpc = {
        invoke: jest.fn().mockImplementation(async (...args) => {
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve(args[1][1]);
            }, 1500);
          });
        }),
      };

      wrapper.vm.prompts = [{}, { name: "Loading..." }];
      wrapper.vm.promptIndex = 1;

      const questions = [{ name: "validateQ", validate: "__Function" }];
      wrapper.vm.showPrompt(questions);
      await wrapper.vm.$nextTick();

      const response = await questions[0].validate();
      expect(response).to.equal(questions[0].name);
    });
  });

  it("log - method", () => {
    wrapper = initComponent(App, {}, true);
    wrapper.vm.logText = "test_";

    wrapper.vm.log("test_log");

    expect(wrapper.vm.logText).to.equal("test_test_log");
  });

  describe("setPromptList - method", () => {
    it("prompts is empty array", () => {
      wrapper = initComponent(App);

      wrapper.vm.prompts = [{}, {}];
      wrapper.vm.promptIndex = 1;
      wrapper.vm.currentPrompt.status = "pending";

      wrapper.vm.setPromptList([]);

      expect(wrapper.vm.prompts).to.have.length(2);
    });

    it("prompts is undefined", () => {
      wrapper = initComponent(App);

      wrapper.vm.prompts = [{}, {}];
      wrapper.vm.promptIndex = 1;
      wrapper.vm.currentPrompt.status = "pending";

      wrapper.vm.setPromptList();

      expect(wrapper.vm.prompts).to.have.length(2);
    });
  });

  describe("snippetDone - method", () => {
    test("status is pending", () => {
      wrapper = initComponent(App, { donePath: "testDonePath" });
      wrapper.vm.prompts = [{}, {}];
      wrapper.vm.promptIndex = 1;
      wrapper.vm.currentPrompt.status = "pending";

      wrapper.vm.snippetDone(true, "testMessage", "/test/path");

      expect(wrapper.vm.doneMessage).to.equal("testMessage");
      expect(wrapper.vm.donePath).to.equal("/test/path");
      expect(wrapper.vm.isDone).to.be.true;
      expect(wrapper.vm.currentPrompt.name).to.equal("Summary");
    });
  });

  describe("setBusyIndicator - method", () => {
    it("isDone is true, status is pending, prompts is not empty", () => {
      wrapper = initComponent(App);
      wrapper.vm.prompts = [{}, {}];
      wrapper.vm.isDone = true;
      wrapper.vm.currentPrompt.status = "pending";
      wrapper.vm.setBusyIndicator();
      expect(wrapper.vm.showBusyIndicator).to.be.false;
    });
  });

  describe("toggleConsole - method", () => {
    it("showConsole property updated from toggleConsole()", () => {
      wrapper = initComponent(App, {}, true);
      wrapper.vm.toggleConsole();
      expect(wrapper.vm.showConsole).to.be.true;
      wrapper.vm.toggleConsole();
      expect(wrapper.vm.showConsole).to.be.false;
    });
  });

  describe("init - method", () => {
    it("isInVsCode = true", () => {
      wrapper = initComponent(App);

      wrapper.vm.isInVsCode = jest.fn().mockReturnValue(true);
      wrapper.vm.init();

      expect(wrapper.vm.promptIndex).to.equal(0);
      expect(wrapper.vm.prompts).to.be.an("array").that.is.empty;
      expect(wrapper.vm.consoleClass).to.equal("consoleClassHidden");
    });

    it("isInVsCode = false", () => {
      wrapper = initComponent(App);

      wrapper.vm.isInVsCode = jest.fn().mockReturnValue(false);
      wrapper.vm.init();

      expect(wrapper.vm.consoleClass).to.equal("consoleClassVisible");
    });
  });
});
