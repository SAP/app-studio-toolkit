import { expect } from "chai";
import { createSandbox, SinonMock, SinonSandbox, SinonSpy } from "sinon";
import { ConfiguredTask } from "@sap_oss/task_contrib_types";
import { MockConfigTask, mockVscode, MockVSCodeInfo, resetTestVSCode, testVscode } from "../utils/mockVSCode";

mockVscode("../../src/panels/task-editor-panel");
import { duplicateTask } from "../../src/commands/duplicate-task";
import { IntentTreeItem, TaskTreeItem } from "../../src/view/task-tree-item";
import { TreeItemCollapsibleState } from "vscode";
import { messages } from "../../src/i18n/messages";

describe("Command duplicateTask", () => {
  let mockWindow: SinonMock;
  let sandbox: SinonSandbox;
  let spyGetConfiguration: SinonSpy;
  const wsFolder = "wsFolder1";

  before(() => {
    sandbox = createSandbox();
  });

  beforeEach(() => {
    mockWindow = sandbox.mock(testVscode.window);
    spyGetConfiguration = sandbox.spy(testVscode.workspace, "getConfiguration");
  });

  afterEach(() => {
    mockWindow.verify();
    resetTestVSCode();
    sandbox.restore();
  });

  const task1: ConfiguredTask = {
    type: "test",
    label: "aaa",
    __index: 0,
    __intent: "Deploy",
    __wsFolder: wsFolder,
  };
  const command1 = {
    title: "Edit Task",
    command: "tasks-explorer.editTask",
    arguments: [task1],
  };

  const parentItem = new IntentTreeItem("dummy", testVscode.TreeItemCollapsibleState.None);

  it("command wrong", async () => {
    const item1 = new TaskTreeItem(0, "test", "aaa", wsFolder, TreeItemCollapsibleState.None, parentItem);
    await duplicateTask(item1);
    expect(spyGetConfiguration.neverCalledWith("tasks", testVscode.Uri.file(wsFolder))).to.be.true;
  });

  it("task configuration wrong - task not exist", async () => {
    MockVSCodeInfo.configTasks?.set(wsFolder, undefined as unknown as any);
    const item1 = new TaskTreeItem(0, "test", "aaa", wsFolder, TreeItemCollapsibleState.None, parentItem, command1);
    mockWindow
      .expects("showErrorMessage")
      .withExactArgs(new Error(messages.configuration_task_not_found(task1.label)).toString())
      .resolves();
    await duplicateTask(item1);
  });

  it("task configuration wrong - task not found", async () => {
    const confTasks = [new MockConfigTask("task.label", "test")];
    MockVSCodeInfo.configTasks?.set(wsFolder, confTasks);
    const item1 = new TaskTreeItem(0, "test", "aaa", wsFolder, TreeItemCollapsibleState.None, parentItem, command1);
    mockWindow
      .expects("showErrorMessage")
      .withExactArgs(new Error(messages.configuration_task_not_found(task1.label)).toString())
      .resolves();

    await duplicateTask(item1);
    expect(MockVSCodeInfo.configTasks?.get(wsFolder)).to.deep.equal(confTasks);
  });

  it("task found and duplicated", async () => {
    MockVSCodeInfo.configTasks?.set(wsFolder, [new MockConfigTask("aaa", "test")]);
    const item1 = new TaskTreeItem(0, "test", "aaa", wsFolder, TreeItemCollapsibleState.None, parentItem, command1);

    await duplicateTask(item1);
    expect(MockVSCodeInfo.configTasks?.get(wsFolder)).to.deep.equal([
      new MockConfigTask("aaa", "test"),
      new MockConfigTask("copy of aaa", "test"),
    ]);
    expect(spyGetConfiguration.calledWithExactly("tasks", testVscode.Uri.file(wsFolder))).to.be.true;
    expect(spyGetConfiguration.calledTwice).to.be.true;
  });

  it("task found, compose label for duplicated task", async () => {
    MockVSCodeInfo.configTasks?.set(wsFolder, [
      new MockConfigTask("aaa", "test"),
      new MockConfigTask("copy of aaa", "test"),
    ]);
    const item1 = new TaskTreeItem(0, "test", "aaa", wsFolder, TreeItemCollapsibleState.None, parentItem, command1);

    await duplicateTask(item1);
    expect(MockVSCodeInfo.configTasks?.get(wsFolder)).to.deep.equal([
      new MockConfigTask("aaa", "test"),
      new MockConfigTask("copy of aaa", "test"),
      new MockConfigTask("copy of copy of aaa", "test"),
    ]);
    expect(spyGetConfiguration.calledWithExactly("tasks", testVscode.Uri.file(wsFolder))).to.be.true;
    expect(spyGetConfiguration.calledTwice).to.be.true;
  });
});
