import { expect } from "chai";
import { createSandbox, SinonMock, SinonSandbox } from "sinon";
import { ConfiguredTask } from "@sap_oss/task_contrib_types";
import { MockConfigTask, mockVscode, MockVSCodeInfo, resetTestVSCode, testVscode } from "../utils/mockVSCode";
import { MockTasksProvider } from "../utils/mockTasksProvider";

mockVscode("../../src/panels/task-editor-panel");
import { revealTask } from "../../src/commands/reveal-task";
import { editTreeItemTask } from "../../src/commands/edit-task";
import { IntentTreeItem, TaskTreeItem } from "../../src/view/task-tree-item";
import { TreeItemCollapsibleState, Uri } from "vscode";
import { disposeTaskEditorPanel } from "../../src/panels/panels-handler";
import { messages } from "../../src/i18n/messages";
import { size } from "lodash";

describe("Command revealTask", () => {
  let mockWindow: SinonMock;
  const readFile = async function (): Promise<string> {
    return "aaa";
  };

  let sandbox: SinonSandbox;
  const wsFolder = "wsFolder1";

  before(() => {
    sandbox = createSandbox();
  });

  beforeEach(() => {
    mockWindow = sandbox.mock(testVscode.window);
  });

  afterEach(() => {
    mockWindow.verify();
    disposeTaskEditorPanel();
    resetTestVSCode();
    sandbox.restore();
  });

  const label = "test - (contains .spe$[cial ch]}ars)";
  const task1: ConfiguredTask = {
    type: "test",
    label: label,
    __index: 0,
    __intent: "Deploy",
    __wsFolder: wsFolder,
  };
  const command1 = {
    title: "Edit Task",
    command: "tasks-explorer.editTask",
    arguments: [task1],
  };

  let text = JSON.stringify({
    version: "2.0.0",
    tasks: [
      {
        type: "test",
        label: label,
        path: "project1",
        script: "deploy-config",
      },
    ],
  });
  const docEditor = {
    document: {
      getText: () => text,
      positionAt: (phrase: string) => {
        size(phrase);
      },
    },
    revealRange: () => null,
  };

  const parentItem = new IntentTreeItem("dummy", testVscode.TreeItemCollapsibleState.None);

  it("task already opened for editing, task panel will be disposed and task reveal in 'tasks.json'", async () => {
    MockVSCodeInfo.configTasks?.set(wsFolder, [new MockConfigTask("aaa", "test")]);
    const item1 = new TaskTreeItem(0, "test", label, wsFolder, TreeItemCollapsibleState.None, parentItem, command1);

    await editTreeItemTask(new MockTasksProvider([task1]), readFile, task1);
    expect(MockVSCodeInfo.webViewCreated).eq(1);

    const resource = Uri.joinPath(Uri.file(task1.__wsFolder), ".vscode", "tasks.json");
    mockWindow.expects("showTextDocument").withExactArgs(resource, { preview: false }).resolves(docEditor);
    await revealTask(item1);
    expect(MockVSCodeInfo.disposeCalled).eq(true);
  });

  it("task reveal in 'tasks.json'", async () => {
    const item1 = new TaskTreeItem(0, "test", label, wsFolder, TreeItemCollapsibleState.None, parentItem, command1);
    const resource = Uri.joinPath(Uri.file(task1.__wsFolder), ".vscode", "tasks.json");
    mockWindow.expects("showTextDocument").withExactArgs(resource, { preview: false }).resolves(docEditor);
    await revealTask(item1);
    expect(MockVSCodeInfo.disposeCalled).eq(false);
  });

  it("command wrong", async () => {
    const item1 = new TaskTreeItem(0, "test", label, wsFolder, TreeItemCollapsibleState.None, parentItem);
    mockWindow.expects("showTextDocument").never();
    await revealTask(item1);
    expect(MockVSCodeInfo.disposeCalled).eq(false);
  });

  it("task item info wrong", async () => {
    const item1 = new TaskTreeItem(0, "test", label, wsFolder, TreeItemCollapsibleState.None, parentItem, command1);
    const resource = Uri.joinPath(Uri.file(task1.__wsFolder), ".vscode", "tasks.json");
    mockWindow.expects("showTextDocument").withExactArgs(resource, { preview: false }).resolves();
    mockWindow
      .expects("showErrorMessage")
      .withExactArgs(new Error(messages.resource_open_could_not_open_editor).toString())
      .resolves();
    await revealTask(item1);
  });

  it("task configuration wrong or broken", async () => {
    const item1 = new TaskTreeItem(0, "test", label, wsFolder, TreeItemCollapsibleState.None, parentItem, command1);
    const resource = Uri.joinPath(Uri.file(task1.__wsFolder), ".vscode", "tasks.json");
    text = JSON.stringify({
      version: "2.0.0",
      tasks: [
        {
          type: "other",
          label: "label2",
          path: "project1",
          script: "deploy-config",
        },
        {
          type: "test",
          label: "label1",
          path: "project1",
          script: "deploy-config",
        },
      ],
    });
    mockWindow.expects("showTextDocument").withExactArgs(resource, { preview: false }).resolves(docEditor);
    mockWindow
      .expects("showErrorMessage")
      .withExactArgs(new Error(messages.configuration_task_not_found(task1.label)).toString())
      .resolves();
    await revealTask(item1);
  });
});
