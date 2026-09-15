import { expect } from "chai";
import { SinonMock, SinonSandbox, SinonStub, createSandbox, useFakeTimers } from "sinon";
import { mockVscode, resetTestVSCode, testVscode } from "../utils/mockVSCode";
import { MockTasksProvider } from "../utils/mockTasksProvider";
mockVscode("src/commands/action");
import * as action from "../../src/commands/action";
import { TasksTree } from "../../src/view/tasks-tree";
mockVscode("src/view/task-tree-item");
import { IntentTreeItem, ProjectTreeItem, TaskTreeItem } from "../../src/view/task-tree-item";

describe("action module", () => {
  let sandbox: SinonSandbox;
  before(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    resetTestVSCode();
    sandbox.restore();
  });

  describe("subscribeTaskRun scope", () => {
    const task: any = { definition: { type: "test" }, name: "test", scope: "test" };
    const getRunTask = () => task;
    const event: any = { execution: { task: getRunTask() } };

    let mockWorkspaceState: SinonMock;
    let mockTask: SinonStub;

    beforeEach(() => {
      mockWorkspaceState = sandbox.mock(testVscode.ExtensionContext.workspaceState);
      mockTask = sandbox.stub(testVscode.tasks);
    });
    afterEach(() => {
      mockWorkspaceState.verify();
    });

    it("run a task of a group other than `build` or `deploy`", async () => {
      mockWorkspaceState.expects("get").withExactArgs("lastTaskState").returns(undefined);
      action.subscribeTaskRun(testVscode.ExtensionContext);
      expect(mockTask["onDidStartTask"].calledOnce).to.have.been.true;
      const callback = mockTask["onDidStartTask"].getCall(0).args[0];
      callback(event);
    });

    it("run a task of `build` group", async () => {
      const lastRunTaskState = { build: undefined, deploy: undefined };
      task.definition.type = "build";
      mockWorkspaceState.expects("get").withExactArgs("lastTaskState").returns(lastRunTaskState);
      mockWorkspaceState
        .expects("update")
        .withExactArgs("lastTaskState", {
          ...lastRunTaskState,
          build: { ...getRunTask() },
        })
        .resolves();
      action.subscribeTaskRun(testVscode.ExtensionContext);
      const callback = mockTask["onDidStartTask"].getCall(0).args[0];
      callback(event);
    });

    it("run a task of `deploy` group", async () => {
      const lastRunTaskState = { build: undefined, deploy: undefined };
      task.name = "deploY test project";
      mockWorkspaceState.expects("get").withExactArgs("lastTaskState").returns(lastRunTaskState);
      mockWorkspaceState
        .expects("update")
        .withExactArgs("lastTaskState", {
          ...lastRunTaskState,
          deploy: { ...getRunTask() },
        })
        .resolves();
      action.subscribeTaskRun(testVscode.ExtensionContext);
      const callback = mockTask["onDidStartTask"].getCall(0).args[0];
      callback(event);
    });

    it("run same task as a last run one", async () => {
      const lastRunTaskState = { build: undefined, deploy: { ...getRunTask() } };
      task.name = "deploY test project";
      mockWorkspaceState.expects("get").withExactArgs("lastTaskState").returns(lastRunTaskState);
      mockWorkspaceState.expects("update").never();
      action.subscribeTaskRun(testVscode.ExtensionContext);
      const callback = mockTask["onDidStartTask"].getCall(0).args[0];
      callback(event);
    });

    it("run a task of `build` group, workspace state update error", async () => {
      const lastRunTaskState = { build: undefined, deploy: undefined };
      task.definition.type = "build";
      task.name = "test project";
      mockWorkspaceState.expects("get").withExactArgs("lastTaskState").returns(lastRunTaskState);
      mockWorkspaceState
        .expects("update")
        .withExactArgs("lastTaskState", {
          ...lastRunTaskState,
          build: { ...getRunTask() },
        })
        .rejects(Object.create(null));
      action.subscribeTaskRun(testVscode.ExtensionContext);
      const callback = mockTask["onDidStartTask"].getCall(0).args[0];
      callback(event);
    });
  });

  describe("runAction scope", () => {
    const roots = ["/user/projects/project1", "/user/projects/project2", "/user/projects/project3"];
    const task1 = {
      label: "Template: task1",
      type: "testType",
      prop1: "value1",
      description: "task description",
      taskType: "testIntent",
      __intent: "build",
      __wsFolder: roots[0],
      __extensionName: "testExtension",
    };
    const task2 = { ...task1, label: "task2", __intent: "deploy" };
    const task3 = { ...task1, label: "task3", __intent: "deploy" };

    const parentItem = new IntentTreeItem("dummy");
    const mockTaskProvider = new MockTasksProvider([]);
    const dataProvider = {
      findTreeItem: () => Promise.resolve(undefined),
    } as unknown as TasksTree;

    let clock: sinon.SinonFakeTimers;
    let mockCommands: SinonMock;
    let mockWindow: SinonMock;
    let mockWorkspaceState: SinonMock;

    beforeEach(() => {
      clock = useFakeTimers();
      mockCommands = sandbox.mock(testVscode.commands);
      mockWindow = sandbox.mock(testVscode.window);
      mockWorkspaceState = sandbox.mock(testVscode.ExtensionContext.workspaceState);
    });

    afterEach(() => {
      clock.restore();
      mockCommands.verify();
      mockWindow.verify();
      mockWorkspaceState.verify();
    });

    it("call `runAction` when workspace undefined", async () => {
      testVscode.workspace.workspaceFolders = undefined;
      action.runAction("build", dataProvider, mockTaskProvider, testVscode.ExtensionContext);
      // Advance time to exactly the debounce delay
      clock.tick(600);
    });

    it("call `runAction` when no workspace open", async () => {
      testVscode.workspace.workspaceFolders = [];
      action.runAction("build", dataProvider, mockTaskProvider, testVscode.ExtensionContext);
      clock.tick(600);
    });

    it("call `runAction` when only one task available", async () => {
      testVscode.workspace.workspaceFolders = [{ uri: { path: roots[0] } }];
      const item = new TaskTreeItem(
        0,
        task1.type,
        task1.label,
        task1.__wsFolder,
        testVscode.TreeItemCollapsibleState.None,
        parentItem,
      );
      sandbox.stub(dataProvider, "findTreeItem").withArgs(task1).resolves(item);
      mockCommands.expects("executeCommand").withExactArgs("tasks-explorer.tree.select", task1).resolves();
      mockCommands.expects("executeCommand").withExactArgs("tasks-explorer.executeTask", item).resolves();
      action.runAction("build", dataProvider, new MockTasksProvider([task1]), testVscode.ExtensionContext);
      clock.tick(600);
    });

    it("call `runAction` when only one task available, but a corresponding view item not found", async () => {
      testVscode.workspace.workspaceFolders = [{ uri: { path: roots[0] } }];
      sandbox.stub(dataProvider, "findTreeItem").withArgs(task1).resolves(undefined);
      mockCommands.expects("executeCommand").never();
      action.runAction("build", dataProvider, new MockTasksProvider([task1]), testVscode.ExtensionContext);
      clock.tick(600);
    });

    it("call `runAction` when only one task available, but a corresponding view item not found", async () => {
      testVscode.workspace.workspaceFolders = [{ uri: { path: roots[0] } }];
      sandbox.stub(dataProvider, "findTreeItem").withArgs(task1).resolves(undefined);
      mockCommands.expects("executeCommand").never();
      action.runAction("build", dataProvider, new MockTasksProvider([task1]), testVscode.ExtensionContext);
      clock.tick(600);
    });

    it("call `runAction` when no task available", async () => {
      testVscode.workspace.workspaceFolders = [{ uri: { path: roots[0] } }];
      mockCommands
        .expects("executeCommand")
        .withExactArgs(
          "tasks-explorer.createTask",
          new IntentTreeItem("deploy", testVscode.TreeItemCollapsibleState.Collapsed, new ProjectTreeItem("", "")),
        )
        .resolves();
      action.runAction("deploy", dataProvider, new MockTasksProvider([task1]), testVscode.ExtensionContext);
      clock.tick(600);
    });

    it("call `runAction` on one root and several tasks available, selection canceled", async () => {
      testVscode.workspace.workspaceFolders = [{ uri: { path: roots[0] } }];
      mockWindow
        .expects("showQuickPick")
        .withExactArgs(
          [
            { ...task3, ...{ description: task3.type }, ...{ detail: task3.__wsFolder } },
            { ...task2, ...{ description: task2.type }, ...{ detail: task2.__wsFolder } },
            { kind: -1, label: "configure" },
            { label: "Create Task..." },
          ],
          {
            placeHolder: "What would you like to run?",
            ignoreFocusOut: true,
            matchOnDescription: true,
            matchOnDetail: true,
          },
        )
        .resolves();
      action.runAction("deploy", dataProvider, new MockTasksProvider([task3, task2]), testVscode.ExtensionContext);
      clock.tick(600);
    });

    it("call `runAction` on one root and several tasks available, task selected", async () => {
      testVscode.workspace.workspaceFolders = [{ uri: { path: roots[0] } }];
      mockWorkspaceState.expects("get").withExactArgs("lastTaskState").returns(undefined);
      const items = [
        { ...task3, ...{ description: task3.type }, ...{ detail: task3.__wsFolder } },
        { ...task2, ...{ description: task2.type }, ...{ detail: task2.__wsFolder } },
        { kind: -1, label: "configure" },
        { label: "Create Task..." },
      ];
      mockWindow.expects("showQuickPick").withArgs(items).resolves(items[1]);
      const treeItem = new TaskTreeItem(
        0,
        task2.type,
        task2.label,
        task2.__wsFolder,
        testVscode.TreeItemCollapsibleState.None,
        parentItem,
      );
      sandbox.stub(dataProvider, "findTreeItem").withArgs(task2).resolves(treeItem);
      mockCommands.expects("executeCommand").withExactArgs("tasks-explorer.tree.select", task2).resolves();
      mockCommands.expects("executeCommand").withExactArgs("tasks-explorer.executeTask", treeItem).resolves();
      action.runAction("deploy", dataProvider, new MockTasksProvider([task3, task2]), testVscode.ExtensionContext);
      clock.tick(600);
    });

    it("call `runAction` on one root and several tasks available, 'create task ...' selected", async () => {
      testVscode.workspace.workspaceFolders = [{ uri: { path: roots[0] } }];
      const items = [
        { ...task3, ...{ description: task3.type }, ...{ detail: task3.__wsFolder } },
        { ...task2, ...{ description: task2.type }, ...{ detail: task2.__wsFolder } },
        { kind: -1, label: "configure" },
        { label: "Create Task..." },
      ];
      mockWindow.expects("showQuickPick").withArgs(items).resolves(items[3]);
      mockCommands
        .expects("executeCommand")
        .withExactArgs(
          "tasks-explorer.createTask",
          new IntentTreeItem("deploy", testVscode.TreeItemCollapsibleState.Collapsed, new ProjectTreeItem("", "")),
        )
        .resolves();

      action.runAction("deploy", dataProvider, new MockTasksProvider([task3, task2]), testVscode.ExtensionContext);
      clock.tick(600);
    });

    it("call `runAction` on one root and several tasks available, lastRun task detected, selection canceled", async () => {
      testVscode.workspace.workspaceFolders = [{ uri: { path: roots[0] } }];
      mockWorkspaceState
        .expects("get")
        .withExactArgs("lastTaskState")
        .returns({
          build: undefined,
          deploy: {
            definition: { type: task2.type },
            name: task2.label,
            scope: "test",
          },
        });
      mockWindow
        .expects("showQuickPick")
        .withArgs([
          { kind: -1, label: "Last Run" },
          { ...task2, ...{ description: task2.type }, ...{ detail: task2.__wsFolder } },
          { kind: -1, label: "" },
          { ...task3, ...{ description: task3.type }, ...{ detail: task3.__wsFolder } },
          { kind: -1, label: "configure" },
          { label: "Create Task..." },
        ])
        .resolves();
      action.runAction("deploy", dataProvider, new MockTasksProvider([task3, task2]), testVscode.ExtensionContext);
      clock.tick(600);
    });

    it("call `runAction` on one root and several tasks available, task selected but not identified", async () => {
      testVscode.workspace.workspaceFolders = [{ uri: { path: roots[0] } }];
      mockWorkspaceState.expects("get").withExactArgs("lastTaskState").returns(undefined);
      const items = [
        { ...task3, ...{ description: task3.type }, ...{ detail: task3.__wsFolder } },
        { ...task2, ...{ description: task2.type }, ...{ detail: task2.__wsFolder } },
        { kind: -1, label: "configure" },
        { label: "Create Task..." },
      ];
      mockWindow
        .expects("showQuickPick")
        .withArgs(items)
        .resolves({ ...items[2], type: "unknown" });
      action.runAction("deploy", dataProvider, new MockTasksProvider([task3, task2]), testVscode.ExtensionContext);
      clock.tick(600);
    });

    it("repeated call `runAction` - last selected task info found, task identified", async () => {
      testVscode.workspace.workspaceFolders = [{ uri: { path: roots[0] } }];
      mockWorkspaceState
        .expects("get")
        .withExactArgs("lastTaskState")
        .returns({ deploy: { definition: { type: task2.type }, name: task2.label, scope: "test" } });
      const treeItem = new TaskTreeItem(
        0,
        task2.type,
        task2.label,
        task2.__wsFolder,
        testVscode.TreeItemCollapsibleState.None,
        parentItem,
      );
      sandbox.stub(dataProvider, "findTreeItem").withArgs(task2).resolves(treeItem);
      mockCommands.expects("executeCommand").withExactArgs("tasks-explorer.tree.select", task2).resolves();
      mockCommands.expects("executeCommand").withExactArgs("tasks-explorer.executeTask", treeItem).resolves();
      action.runAction("deploy", dataProvider, new MockTasksProvider([task3, task2]), testVscode.ExtensionContext);
      clock.tick(600);
    });

    it("repeated call `runAction` - last selected task info found, task not identified", async () => {
      testVscode.workspace.workspaceFolders = [{ uri: { path: roots[0] } }];
      mockWorkspaceState
        .expects("get")
        .withExactArgs("lastTaskState")
        .twice()
        .returns({ deploy: { definition: { type: task2.type }, name: "task2.label", scope: "test" } });
      action.runAction("deploy", dataProvider, new MockTasksProvider([task3, task2]), testVscode.ExtensionContext);
      clock.tick(600);
    });
  });
});
