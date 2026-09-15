import { mockVscode, MockVSCodeInfo, resetTestVSCode, testVscode } from "../utils/mockVSCode";
import { MockTasksProvider } from "../utils/mockTasksProvider";
mockVscode("src/panels/panels-handler");
import * as panelHandler from "../../src/panels/panels-handler";
mockVscode("src/commands/create-task");
import { createTask } from "../../src/commands/create-task";
mockVscode("src/commands/edit-task");
import { editTreeItemTask } from "../../src/commands/edit-task";
import { TaskEditor } from "../../src/task-editor";
import { messages } from "../../src/i18n/messages";
import { createSandbox, SinonMock, SinonSandbox } from "sinon";
import { expect } from "chai";
import { fail } from "assert";
import { ProjectTreeItem } from "../../src/view/task-tree-item";

describe("Command createTask", () => {
  const tasks = [
    {
      label: "task 1",
      type: "testType",
      taskType: "Deploy",
      prop1: "value 1.1",
    },
    {
      label: "task 2",
      type: "testType",
      taskType: "Deploy",
      prop1: "value 1.2",
    },
  ];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- leave unused args for reference
  const readFile = async function (path: string): Promise<string> {
    return "aaa";
  };

  const mockTaskProvider = new MockTasksProvider(tasks);

  let sandbox: SinonSandbox;
  let mockPanelHandler: SinonMock;
  before(() => {
    sandbox = createSandbox();
  });

  beforeEach(() => {
    mockPanelHandler = sandbox.mock(panelHandler);
  });

  afterEach(() => {
    panelHandler.disposeTaskEditorPanel();
    resetTestVSCode();
    mockPanelHandler.verify();
    sandbox.restore();
  });

  it("creates tasks selection panel", async () => {
    const mockWindow = sandbox.mock(testVscode.window);
    mockWindow.expects("showErrorMessage").resolves();
    await createTask(new MockTasksProvider(tasks), readFile);
    // async waiting for finish the flow
    await new Promise((resolve) => setTimeout(() => resolve(true), 100));
    mockWindow.verify();
  });

  it("creates tasks selection panel - no tasks found", async () => {
    try {
      await createTask(new MockTasksProvider([]), readFile);
      fail("should fail");
    } catch (e: any) {
      expect(e.message).to.be.equal(messages.MISSING_AUTO_DETECTED_TASKS());
    }
  });

  it(`creates panel for tasks selection when called with some task opened for editing but not changed`, async () => {
    await editTreeItemTask(mockTaskProvider, readFile, {
      label: "task 3",
      type: "testType",
      taskType: "Deploy",
      prop1: "value 1.3",
    });
    // editor panel created
    const others = [
      {
        label: "task 1",
        type: "testType",
        taskType: "Deploy",
        prop1: "value 1.1",
      },
    ];
    mockPanelHandler.expects("createTasksSelection").withExactArgs(others, readFile, undefined);
    await createTask(new MockTasksProvider(others), readFile);
    // selection panel created
  });

  it(`does not create panel for tasks selection when called with some task being edited and user does not agree to discard the changes`, async () => {
    await editTreeItemTask(mockTaskProvider, readFile, tasks[0]);
    // editor panel created
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- suppress for test scope
    const taskEditor: TaskEditor = panelHandler.getTaskEditor()!;
    taskEditor["changed"] = true;
    MockVSCodeInfo.dialogAnswer = "other";
    mockPanelHandler.expects("createTasksSelection").never();
    await createTask(new MockTasksProvider([]), readFile);
    // selection panel not created
  });

  it(`creates panel for tasks selection when called with some task being edited and user agrees to discard the changes`, async () => {
    await editTreeItemTask(mockTaskProvider, readFile, tasks[1]);
    // editor panel initiated
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- suppress for test scope
    const taskEditor: TaskEditor = panelHandler.getTaskEditor()!;
    taskEditor["changed"] = true;
    MockVSCodeInfo.dialogAnswer = messages.DISCARD_CHANGES_BUTTON_TEXT();
    mockPanelHandler.expects("createTasksSelection").withExactArgs(tasks, readFile, undefined);
    await createTask(new MockTasksProvider(tasks), readFile);
    // selection panel created
  });

  describe("Function disposeTaskEditorView", () => {
    it("creates new instance of panel on the second call after disposing a previous instance", async () => {
      const tasks = [
        {
          label: "task 2",
          type: "testType",
          taskType: "Deploy",
          prop1: "value 1.2",
        },
      ];
      const projectItem = new ProjectTreeItem("project", "/root/home/test/proj");
      mockPanelHandler.expects("createTasksSelection").withExactArgs(tasks, readFile, projectItem);
      mockPanelHandler.expects("disposeTaskEditorPanel").atLeast(2);
      mockPanelHandler.expects("createTasksSelection").withExactArgs(tasks, readFile, undefined);
      await createTask(new MockTasksProvider(tasks), readFile, projectItem);
      await panelHandler.createTaskEditorPanel(tasks[0], readFile);
      await createTask(new MockTasksProvider(tasks), readFile);
    });
  });
});
