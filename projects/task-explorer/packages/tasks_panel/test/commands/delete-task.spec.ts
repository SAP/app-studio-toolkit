import { expect } from "chai";
import { createSandbox, SinonMock, SinonSandbox, SinonSpy } from "sinon";
import { ConfiguredTask } from "@sap_oss/task_contrib_types";
import { MockConfigTask, mockVscode, MockVSCodeInfo, resetTestVSCode, testVscode } from "../utils/mockVSCode";
import { MockTasksProvider } from "../utils/mockTasksProvider";

mockVscode("../../src/panels/task-editor-panel");
import { deleteTask } from "../../src/commands/delete-task";
import { editTreeItemTask } from "../../src/commands/edit-task";
import { IntentTreeItem, TaskTreeItem } from "../../src/view/task-tree-item";
import { TreeItemCollapsibleState } from "vscode";
import { disposeTaskEditorPanel } from "../../src/panels/panels-handler";
import { messages } from "../../src/i18n/messages";

describe("Command deleteTask", () => {
  let mockWindow: SinonMock;
  const readFile = async function (): Promise<string> {
    return "aaa";
  };

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
    disposeTaskEditorPanel();
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

  it("task already opened for editing, task panel will be disposed and task deleted", async () => {
    MockVSCodeInfo.configTasks?.set(wsFolder, [new MockConfigTask("aaa", "test")]);
    const item1 = new TaskTreeItem(0, "test", "aaa", wsFolder, TreeItemCollapsibleState.None, parentItem, command1);

    await editTreeItemTask(new MockTasksProvider([task1]), readFile, task1);
    expect(MockVSCodeInfo.webViewCreated).eq(1);
    mockWindow
      .expects("showInformationMessage")
      .withExactArgs(messages.delete_task_confirmation(task1.label), { modal: true }, "Delete")
      .resolves("Delete");
    await deleteTask(item1);
    expect(MockVSCodeInfo.configTasks?.get(wsFolder)).to.empty;
    expect(MockVSCodeInfo.disposeCalled).eq(true);
    expect(spyGetConfiguration.calledTwice).to.be.true;
    expect(spyGetConfiguration.calledWithExactly("tasks", testVscode.Uri.file(wsFolder))).to.be.true;
  });

  it("task is not opened for editing, task will be deleted", async () => {
    MockVSCodeInfo.configTasks?.set("wsFolder1", [new MockConfigTask("aaa", "test")]);
    const item1 = new TaskTreeItem(0, "test", "aaa", wsFolder, TreeItemCollapsibleState.None, parentItem, command1);
    mockWindow
      .expects("showInformationMessage")
      .withExactArgs(messages.delete_task_confirmation(task1.label), { modal: true }, "Delete")
      .resolves("Delete");
    await deleteTask(item1);
    expect(MockVSCodeInfo.updateCalled.section).to.be.equal("tasks");
    expect(MockVSCodeInfo.updateCalled.configurationTarget).to.be.equal(testVscode.ConfigurationTarget.WorkspaceFolder);
    expect(MockVSCodeInfo.configTasks?.get(wsFolder)).to.empty;
    expect(spyGetConfiguration.calledTwice).to.be.true;
    expect(spyGetConfiguration.calledWithExactly("tasks", testVscode.Uri.file(wsFolder))).to.be.true;
  });

  it("tasks configuration is undefined, configuration is not updated", async () => {
    MockVSCodeInfo.configTasks = new Map<string, MockConfigTask[]>();
    const item1 = new TaskTreeItem(0, "test", "aaa", wsFolder, TreeItemCollapsibleState.None, parentItem, command1);
    mockWindow
      .expects("showInformationMessage")
      .withExactArgs(messages.delete_task_confirmation(task1.label), { modal: true }, "Delete")
      .resolves("Delete");
    await deleteTask(item1);
    expect(MockVSCodeInfo.updateCalled).be.undefined;
    expect(spyGetConfiguration.calledOnceWithExactly("tasks", testVscode.Uri.file(wsFolder))).to.be.true;
  });

  it("operation canceled", async () => {
    const item1 = new TaskTreeItem(0, "test", "aaa", wsFolder, TreeItemCollapsibleState.None, parentItem, command1);
    mockWindow
      .expects("showInformationMessage")
      .withExactArgs(messages.delete_task_confirmation(task1.label), { modal: true }, "Delete")
      .resolves();
    await deleteTask(item1);
    expect(MockVSCodeInfo.updateCalled).be.undefined;
  });

  it("task's index is out of tasks configuration boundaries, configuration is not updated", async () => {
    MockVSCodeInfo.configTasks?.set(wsFolder, [new MockConfigTask("aaa", "test")]);
    const task1: ConfiguredTask = {
      type: "test",
      label: "aaa",
      __index: 2,
      __intent: "Deploy",
      __wsFolder: wsFolder,
    };
    const command1 = {
      title: "Edit Task",
      command: "tasks-explorer.editTask",
      arguments: [task1],
    };
    const item1 = new TaskTreeItem(2, "test", "aaa", wsFolder, TreeItemCollapsibleState.None, parentItem, command1);
    mockWindow
      .expects("showInformationMessage")
      .withExactArgs(messages.delete_task_confirmation(task1.label), { modal: true }, "Delete")
      .resolves("Delete");
    await deleteTask(item1);
    expect(MockVSCodeInfo.updateCalled).be.undefined;
    expect(spyGetConfiguration.calledOnceWithExactly("tasks", testVscode.Uri.file(wsFolder))).to.be.true;
  });

  it("task contains command without arguments", async () => {
    MockVSCodeInfo.configTasks?.set(wsFolder, [new MockConfigTask("aaa", "test")]);
    const command1 = {
      title: "Edit Task",
      command: "tasks-explorer.editTask",
      arguments: undefined,
    };
    const item1 = new TaskTreeItem(0, "test", "aaa", wsFolder, TreeItemCollapsibleState.None, parentItem, command1);

    await deleteTask(item1);
    expect(MockVSCodeInfo.configTasks?.get(wsFolder)).to.not.empty;
    expect(spyGetConfiguration.called).to.be.false;
  });

  it("item does not contain command", async () => {
    MockVSCodeInfo.configTasks?.set(wsFolder, [new MockConfigTask("aaa", "test")]);
    const item1 = new TaskTreeItem(0, "test", "aaa", wsFolder, TreeItemCollapsibleState.None, parentItem);

    await deleteTask(item1);
    expect(MockVSCodeInfo.configTasks?.get(wsFolder)).to.not.empty;
    expect(spyGetConfiguration.called).to.be.false;
  });
});
