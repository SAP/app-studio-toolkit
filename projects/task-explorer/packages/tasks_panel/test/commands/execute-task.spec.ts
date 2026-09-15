import { SinonSandbox, SinonMock, createSandbox, restore } from "sinon";
import { TreeItemCollapsibleState } from "vscode";
import { ConfiguredTask } from "@sap_oss/task_contrib_types";

import { mockVscode, testVscode } from "../utils/mockVSCode";
mockVscode("src/services/tasks-executor");
import { executeTaskFromTree } from "../../src/commands/execute-task";
import { IntentTreeItem, TaskTreeItem } from "../../src/view/task-tree-item";

describe("Command executeTaskFromTree", () => {
  let sandbox: SinonSandbox;
  let tasksMock: SinonMock;

  const task1: ConfiguredTask = {
    type: "test",
    label: "aaa",
    __index: 0,
    __intent: "Deploy",
    __wsFolder: { path: "wsFolder1" },
  };

  before(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    restore();
    sandbox.restore();
    tasksMock.restore();
  });

  beforeEach(() => {
    tasksMock = sandbox.mock(testVscode.tasks);
  });

  const parentItem = new IntentTreeItem("dummy", testVscode.TreeItemCollapsibleState.None);

  it("tree item task has valid structure and exists among fetched task -> tasks.executeTask command is called", async () => {
    const command1 = {
      title: "Edit Task",
      command: "tasks-explorer.editTask",
      arguments: [task1],
    };
    const item1 = new TaskTreeItem(0, "test", "aaa", "wsFolder1", TreeItemCollapsibleState.None, parentItem, command1);

    tasksMock
      .expects("fetchTasks")
      .once()
      .returns([{ name: "aaa" }]);
    tasksMock.expects("executeTask").once().withExactArgs({ name: "aaa" });

    await executeTaskFromTree(item1);
    tasksMock.verify();
  });

  it("tree item task doesnt have command property -> tasks.fetchTasks is never called", async () => {
    const item1 = new TaskTreeItem(0, "test", "aaa", "wsFolder1", TreeItemCollapsibleState.None, parentItem);

    tasksMock.expects("fetchTasks").never();

    await executeTaskFromTree(item1);
    tasksMock.verify();
  });

  it("tree item command has empty arguments property -> tasks.fetchTasks is never called", async () => {
    const command1 = {
      title: "Edit Task",
      command: "tasks-explorer.editTask",
      arguments: [],
    };

    const item1 = new TaskTreeItem(0, "test", "aaa", "wsFolder1", TreeItemCollapsibleState.None, parentItem, command1);

    tasksMock.expects("fetchTasks").never();

    await executeTaskFromTree(item1);
    tasksMock.verify();
  });
});
