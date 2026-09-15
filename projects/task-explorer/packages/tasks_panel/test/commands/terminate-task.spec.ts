import { SinonSandbox, createSandbox, restore } from "sinon";
import { ConfiguredTask } from "@sap_oss/task_contrib_types";
import { mockVscode, testVscode } from "../utils/mockVSCode";
mockVscode("src/services/terminate-task");
import { terminateTaskFromTree } from "../../src/commands/terminate-task";
import { IntentTreeItem, TaskTreeItem } from "../../src/view/task-tree-item";
import { SinonMock } from "sinon";

describe("Command terminateTaskFromTree", () => {
  let sandbox: SinonSandbox;
  let mockWindow: SinonMock;

  const task: ConfiguredTask = {
    type: "type",
    label: "label",
    __index: 0,
    __intent: "Deploy",
    __wsFolder: { path: "wsFolder" },
  };

  before(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    mockWindow.verify();
    restore();
    sandbox.restore();
  });

  beforeEach(() => {
    mockWindow = sandbox.mock(testVscode.window);
  });

  const parentItem = new IntentTreeItem("dummy", testVscode.TreeItemCollapsibleState.None);

  it("tree item task has valid structure and exists -> terminateVScodeTask() is called", async () => {
    const command = {
      title: ".Stop.",
      command: ".terminateTask.",
      arguments: [task],
    };
    sandbox
      .stub(testVscode.tasks, "taskExecutions")
      .value([{ task: { name: "label", definition: { type: "type" } }, terminate: () => true }]);
    const item = new TaskTreeItem(
      0,
      "type",
      "label",
      "wsFolder",
      testVscode.TreeItemCollapsibleState.None,
      parentItem,
      command,
    );
    await terminateTaskFromTree(item);
  });

  it("tree item task has invalid structure", async () => {
    const command = {
      title: ".Stop.",
      command: ".terminateTask.",
      arguments: [],
    };
    const item = new TaskTreeItem(
      0,
      "type",
      "label",
      "wsFolder",
      testVscode.TreeItemCollapsibleState.None,
      parentItem,
      command,
    );
    mockWindow
      .expects("showErrorMessage")
      .withExactArgs(new Error("Unexpected error: command event corrupted").toString())
      .resolves();
    await terminateTaskFromTree(item);
  });

  it("tree item task has invalid structure (cont.)", async () => {
    const item = new TaskTreeItem(0, "type", "label", "wsFolder", testVscode.TreeItemCollapsibleState.None, parentItem);
    mockWindow
      .expects("showErrorMessage")
      .withExactArgs(new Error("Unexpected error: command event corrupted").toString())
      .resolves();
    await terminateTaskFromTree(item);
  });

  it("tree item task has valid structure, operation failed", async () => {
    const command = {
      title: ".Stop.",
      command: ".terminateTask.",
      arguments: [task],
    };
    const item = new TaskTreeItem(
      0,
      "type",
      "label",
      "wsFolder",
      testVscode.TreeItemCollapsibleState.None,
      parentItem,
      command,
    );
    mockWindow.expects("showErrorMessage").resolves();
    await terminateTaskFromTree(item);
  });
});
