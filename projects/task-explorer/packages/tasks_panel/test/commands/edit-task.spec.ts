/* eslint-disable eslint-comments/disable-enable-pair -- suppress for tests scope */
/* eslint-disable @typescript-eslint/no-non-null-assertion -- suppress for test scope */
/* eslint-disable @typescript-eslint/no-unused-vars -- leave unsused arg for reference in test scope */
import { expect } from "chai";
import { createSandbox } from "sinon";

import { mockVscode, MockVSCodeInfo, resetTestVSCode } from "../utils/mockVSCode";
import { MockTasksProvider } from "../utils/mockTasksProvider";

mockVscode("../../src/panels/task-editor-panel");
import { editTreeItemTask } from "../../src/commands/edit-task";
import { disposeTaskEditorPanel, getTaskEditor, getTaskEditorPanel } from "../../src/panels/panels-handler";
import { createLoggerWrapperMock, resetLoggerMessage } from "../utils/loggerWrapperMock";

describe("Command editTask", () => {
  const readFile = async function (path: string): Promise<string> {
    return "aaa";
  };

  const tasks = [
    {
      label: "task 1",
      type: "testType",
      taskType: "Deploy",
      __intent: "Deploy",
      prop1: "value 1.1",
    },
    {
      label: "task 2",
      type: "testType",
      taskType: "Build",
      __intent: "Build",
      prop1: "value 1.2",
    },
  ];

  const mockTaskProvider = new MockTasksProvider(tasks);
  let sandbox: any;
  let loggerWrapperMock: any;

  beforeEach(() => {
    sandbox = createSandbox();
    loggerWrapperMock = createLoggerWrapperMock(sandbox);
  });

  afterEach(() => {
    sandbox.restore();
    resetLoggerMessage();
    disposeTaskEditorPanel();
    resetTestVSCode();
  });

  it("task already opened for editing, not changed, new panel will be opened", async () => {
    await editTreeItemTask(mockTaskProvider, readFile, tasks[0]);
    await editTreeItemTask(mockTaskProvider, readFile, tasks[1]);
    expect(MockVSCodeInfo.webViewCreated).eq(2);
  });

  it("task `aaa` opened for editing but not changed; we ask to edit task `bbb`, editor of task `aaa` is disposed and task `bbb` is opened for editing", async () => {
    await editTreeItemTask(mockTaskProvider, readFile, tasks[0]);
    expect(MockVSCodeInfo.webViewCreated).eq(1);
    await editTreeItemTask(mockTaskProvider, readFile, tasks[1]);
    expect(MockVSCodeInfo.webViewCreated).eq(2);
  });

  it("unrecognized task; view is not created", async () => {
    await editTreeItemTask(mockTaskProvider, readFile, {
      type: "test",
      label: "my test",
      __intent: "unknown",
    });
    expect(MockVSCodeInfo.webViewCreated).eq(0);
  });

  it("task `aaa` opened for editing and changed; we try to edit task `bbb` and answer `Discard Changes` in the dialog; task `aaa` is closed and task `bbb` is opened for editing", async () => {
    await editTreeItemTask(mockTaskProvider, readFile, tasks[0]);
    const taskEditor = getTaskEditor();
    taskEditor!["rpc"]["invoke"] = invokeMock;
    taskEditor!["setAnswers"]({ answers: { label: "aa1" } });
    MockVSCodeInfo.dialogAnswer = "Discard Changes";
    await editTreeItemTask(mockTaskProvider, readFile, tasks[1]);
    expect(MockVSCodeInfo.updateCalled).to.be.undefined;
    expect(MockVSCodeInfo.webViewCreated).eq(2);
  });

  it("task `aaa` opened for editing and changed; we try to edit task `bbb` and answer `No` in the dialog; we continue to edit task `aaa`", async () => {
    await editTreeItemTask(mockTaskProvider, readFile, tasks[0]);
    const taskEditor = getTaskEditor();
    taskEditor!["rpc"]["invoke"] = invokeMock;
    taskEditor?.["setAnswers"]({ answers: { label: "aa1" } });
    MockVSCodeInfo.dialogAnswer = "No";
    await editTreeItemTask(mockTaskProvider, readFile, tasks[1]);
    expect(MockVSCodeInfo.updateCalled).to.be.undefined;
    expect(MockVSCodeInfo.webViewCreated).eq(1);
  });

  it("task `aaa` opened for editing and changed; we try to edit task `aaa` again; new view is not opened and we continue with an old one", async () => {
    await editTreeItemTask(mockTaskProvider, readFile, tasks[0]);
    expect(MockVSCodeInfo.webViewCreated).eq(1);
    const taskEditor = getTaskEditor();
    taskEditor!["rpc"]["invoke"] = invokeMock;
    taskEditor?.["setAnswers"]({ answers: { label: "aa1" } });
    MockVSCodeInfo.dialogAnswer = "cancel";
    await editTreeItemTask(mockTaskProvider, readFile, tasks[1]);
    expect(MockVSCodeInfo.webViewCreated).eq(1);
  });

  it("task `aaa` opened for editing and changed; we try to edit task `aaa` again; new view is not opened", async () => {
    await editTreeItemTask(mockTaskProvider, readFile, tasks[0]);
    expect(MockVSCodeInfo.webViewCreated).eq(1);
    const taskEditor = getTaskEditor();
    taskEditor!["rpc"]["invoke"] = invokeMock;
    taskEditor?.["setAnswers"]({ answers: { label: "aa1" } });
    await editTreeItemTask(mockTaskProvider, readFile, tasks[0]);
    expect(MockVSCodeInfo.webViewCreated).eq(1);
  });

  it("task not changed, no dialog happens", async () => {
    await editTreeItemTask(mockTaskProvider, readFile, tasks[1]);
    const panel = getTaskEditorPanel();
    await panel?.dispose();
    expect(MockVSCodeInfo.disposeCalled).true;
    expect(MockVSCodeInfo.dialogCalled).false;
  });
});

async function invokeMock(method: string, params?: any): Promise<any> {
  return;
}
