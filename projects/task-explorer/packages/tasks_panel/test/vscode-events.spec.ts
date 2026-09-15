import { expect } from "chai";
import { createSandbox, SinonMock, SinonSandbox, SinonSpy } from "sinon";
import { MockConfigTask, mockVscode, MockVSCodeInfo, resetTestVSCode, testVscode } from "./utils/mockVSCode";

mockVscode("/src/vscode-events");
import { VSCodeEvents } from "../src/vscode-events";
import { messages } from "../src/i18n/messages";
import { Contributors } from "../src/services/contributors";
import { MockTaskTypeProvider } from "./utils/mockTaskTypeProvider";
import { cloneDeep, extend } from "lodash";

const task = {
  label: "task 1",
  name: "task 1",
  type: "testType",
  prop1: "value1",
  taskType: "testIntent",
  __index: 0,
  __intent: "testIntent",
  __wsFolder: "path",
  __extensionName: "testExtension",
};
let sandbox: SinonSandbox;
let spyGetConfiguration: SinonSpy;

describe("the VscodeEvents class", () => {
  before(() => {
    sandbox = createSandbox();
  });

  beforeEach(() => {
    spyGetConfiguration = sandbox.spy(testVscode.workspace, "getConfiguration");
  });

  afterEach(() => {
    sandbox.restore();
    resetTestVSCode();
  });

  describe("executeTask method", () => {
    let mockCommands: SinonMock;

    beforeEach(() => {
      mockCommands = sandbox.mock(testVscode.commands);
    });

    afterEach(() => {
      mockCommands.verify();
    });

    it("selects the task from the list of fetched tasks and calls vscode execution task functionality", async () => {
      const vscodeEvents = new VSCodeEvents(testVscode.WebViewPanel);
      MockVSCodeInfo.allTasks = [new MockConfigTask("task 1", "test"), new MockConfigTask("task 2", "test")];
      MockVSCodeInfo.allTasks[0].name = MockVSCodeInfo.allTasks[0].label;
      MockVSCodeInfo.allTasks[1].name = MockVSCodeInfo.allTasks[1].label;
      mockCommands.expects("executeCommand").withExactArgs("tasks-explorer.tree.refresh").twice().resolves();
      await vscodeEvents.executeTask(task);
      await new Promise((resolve) => setTimeout(() => resolve(true), 500)); // 0.5 sec delay to get the flow finish asynchronously
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- suppressed: must be definied for test scope
      expect(MockVSCodeInfo.taskParam!.label).eq("task 1");
      expect(MockVSCodeInfo.executeCalled).true;
    });
  });

  describe("updateTask method", () => {
    it("updates task in tasks configuration. `task 1` instead of `task two`", async () => {
      const folderPath = "path";
      const vscodeEvents = new VSCodeEvents(testVscode.WebViewPanel);
      MockVSCodeInfo.configTasks = new Map<string, MockConfigTask[]>();
      MockVSCodeInfo.configTasks.set(folderPath, [
        new MockConfigTask("task one", "test"),
        new MockConfigTask("task two", "test"),
      ]);
      await vscodeEvents.updateTaskInConfiguration(folderPath, task, 1);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- suppressed: must be definied for test scope
      expect(MockVSCodeInfo.configTasks.get(folderPath)![0].label).eq("task one");
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- suppressed: must be definied for test scope
      expect(MockVSCodeInfo.configTasks.get(folderPath)![1].label).eq("task 1");
      expect(MockVSCodeInfo.updateCalled.section).to.be.equal("tasks");
      expect(MockVSCodeInfo.updateCalled.configurationTarget).to.be.equal(
        testVscode.ConfigurationTarget.WorkspaceFolder,
      );
      expect(spyGetConfiguration.calledTwice).to.be.true;
      expect(spyGetConfiguration.calledWithExactly("tasks", testVscode.Uri.file(folderPath))).to.be.true;
    });

    it("updates task in tasks configuration. `task 2` instead of `task two`, webview panel not exists", async () => {
      const folderPath = "path";
      const vscodeEvents = new VSCodeEvents();
      MockVSCodeInfo.configTasks = new Map<string, MockConfigTask[]>();
      MockVSCodeInfo.configTasks.set(folderPath, [
        new MockConfigTask("task one", "test"),
        new MockConfigTask("task two", "test"),
      ]);
      await vscodeEvents.updateTaskInConfiguration(folderPath, extend(cloneDeep(task), { label: "task 2" }), 1);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- suppressed: must be definied for test scope
      expect(MockVSCodeInfo.configTasks.get(folderPath)![0].label).eq("task one");
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- suppressed: must be definied for test scope
      expect(MockVSCodeInfo.configTasks.get(folderPath)![1].label).eq("task 2");
      expect(MockVSCodeInfo.updateCalled.section).to.be.equal("tasks");
      expect(MockVSCodeInfo.updateCalled.configurationTarget).to.be.equal(
        testVscode.ConfigurationTarget.WorkspaceFolder,
      );
      expect(spyGetConfiguration.calledWithExactly("tasks", testVscode.Uri.file(folderPath))).to.be.true;
      expect(spyGetConfiguration.calledTwice).to.be.true;
    });

    it("logs error on try to update task with wrong index", async () => {
      const vscodeEvents = new VSCodeEvents(testVscode.WebViewPanel);
      MockVSCodeInfo.configTasks = new Map<string, MockConfigTask[]>();
      MockVSCodeInfo.configTasks.set("path", [new MockConfigTask("task one", "test")]);
      await vscodeEvents.updateTaskInConfiguration("path", task, 3);
      expect(MockVSCodeInfo.errorMsg).eq(messages.TASK_UPDATE_FAILED());
    });

    it("logs error on try to update task of undefined configuration", async () => {
      const vscodeEvents = new VSCodeEvents(testVscode.WebViewPanel);
      MockVSCodeInfo.configTasks = undefined;
      await vscodeEvents.updateTaskInConfiguration("path", task, 1);
      expect(MockVSCodeInfo.errorMsg).eq(messages.TASK_UPDATE_FAILED());
    });
  });

  describe("createTask method", () => {
    it("adds new task to the existing configuration and returns its index", async () => {
      const folderPath = "path";
      const vscodeEvents = new VSCodeEvents(testVscode.WebViewPanel);
      MockVSCodeInfo.configTasks = new Map<string, MockConfigTask[]>();
      MockVSCodeInfo.configTasks.set(folderPath, [
        new MockConfigTask("task one", "test"),
        new MockConfigTask("task two", "test"),
      ]);
      expect(await vscodeEvents.addTaskToConfiguration(folderPath, task)).eq(2);
      expect(MockVSCodeInfo.updateCalled.section).to.be.equal("tasks");
      expect(MockVSCodeInfo.updateCalled.configurationTarget).to.be.equal(
        testVscode.ConfigurationTarget.WorkspaceFolder,
      );
      expect(spyGetConfiguration.calledTwice).to.be.true;
      expect(spyGetConfiguration.calledWithExactly("tasks", testVscode.Uri.file(folderPath))).to.be.true;
    });

    it("adds new task to the empty configuration and returns its index", async () => {
      const vscodeEvents = new VSCodeEvents(testVscode.WebViewPanel);
      MockVSCodeInfo.configTasks = undefined;
      expect(await vscodeEvents.addTaskToConfiguration("path", task)).eq(0);
    });
  });

  describe("getTaskPropertyDescription method", () => {
    it("returns property description provided by contributor API", async () => {
      const contributor = new MockTaskTypeProvider();
      Contributors["instance"] = contributor;
      const vscodeEvents = new VSCodeEvents(testVscode.WebViewPanel);
      expect(await vscodeEvents.getTaskPropertyDescription("testType", "property")).eq("property");
    });
  });
});
