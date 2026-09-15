import { SinonSandbox, SinonMock, createSandbox } from "sinon";
import { fail } from "assert";
import { ConfiguredTask } from "@sap_oss/task_contrib_types";

import { mockVscode } from "../utils/mockVSCode";
mockVscode("src/commands/select-tree-item");
import { selectTreeItem } from "../../src/commands/select-tree-item";
import { TasksTree } from "src/view/tasks-tree";
import { ITasksProvider } from "../../src/services/definitions";
import { expect } from "chai";

describe("Command selectTreeItem", () => {
  let sandbox: SinonSandbox;
  let dataProviderMock: SinonMock;
  let viewMock: SinonMock;
  let taskProviderMock: SinonMock;

  const taskProvider: Partial<ITasksProvider> = {
    getConfiguredTasks: () => Promise.resolve([{} as ConfiguredTask]),
  };

  const dataProvider: Partial<TasksTree> = {
    findTreeItem: () => Promise.resolve(undefined),
  };

  const view = {
    reveal: () => Promise.resolve(),
  };

  const task: ConfiguredTask = {
    type: "test",
    label: "aaa",
    __index: 0,
    __intent: "Deploy",
    __wsFolder: { path: "wsFolder1" },
  };

  before(() => {
    sandbox = createSandbox();
  });

  beforeEach(() => {
    taskProviderMock = sandbox.mock(taskProvider);
    dataProviderMock = sandbox.mock(dataProvider);
    viewMock = sandbox.mock(view);
  });

  afterEach(() => {
    sandbox.restore();
    taskProviderMock.verify();
    dataProviderMock.verify();
    viewMock.verify();
  });

  it("selectTreeItem - element found, reveal triggered", async () => {
    const treeItem = { label: "element" };
    taskProviderMock.expects("getConfiguredTasks").resolves([task]);
    dataProviderMock.expects("findTreeItem").withExactArgs(task).resolves(treeItem);
    viewMock.expects("reveal").withExactArgs(treeItem, { select: true, focus: true, expand: true }).resolves();
    await selectTreeItem(view as any, dataProvider as TasksTree, taskProvider as ITasksProvider, task);
  });

  it("selectTreeItem - task not recognized", async () => {
    taskProviderMock.expects("getConfiguredTasks").resolves([]);
    await selectTreeItem(view as any, dataProvider as TasksTree, taskProvider as ITasksProvider, task);
  });

  it("selectTreeItem - task found, but its representing element not found", async () => {
    taskProviderMock.expects("getConfiguredTasks").resolves([task]);
    dataProviderMock.expects("findTreeItem").withExactArgs(task).resolves();
    await selectTreeItem(view as any, dataProvider as TasksTree, taskProvider as ITasksProvider, task);
  });

  it("selectTreeItem - exception thrown", async () => {
    const error = new Error("error");
    taskProviderMock.expects("getConfiguredTasks").rejects(error);
    try {
      await selectTreeItem(view as any, dataProvider as TasksTree, taskProvider as ITasksProvider, task);
      fail("should faile");
    } catch (e: any) {
      expect(e.message).to.be.equal(error.message);
    }
  });
});
