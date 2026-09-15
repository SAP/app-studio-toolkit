import { expect } from "chai";
import sinon = require("sinon");
import { mockVscode, MockVSCodeInfo, resetTestVSCode, testVscode } from "./utils/mockVSCode";
import { createLoggerWrapperMock, getLoggerMessage, resetLoggerMessage } from "./utils/loggerWrapperMock";

mockVscode("/src/task-editor");
import * as path from "path";
import { TaskEditor } from "../src/task-editor";
import { MockRpc } from "./utils/mockRpc";
import { MockAppEvents } from "./utils/mockAppEvents";
import { MockContributor, MockContributorWithOnSave } from "./utils/mockContributor";
import { messages } from "../src/i18n/messages";

mockVscode("/src/services/tasks-providerr");
import { TasksProvider } from "../src/services/tasks-provider";
import { MockTaskTypeProvider } from "./utils/mockTaskTypeProvider";
import { TaskQuestion } from "../src/services/definitions";
import * as extension from "../src/extension";

const task = {
  label: "task 1",
  type: "testType",
  prop1: "value1",
  __index: 0,
  __intent: "testIntent",
  __wsFolder: "path",
  __extensionName: "testExtension",
};

const task2 = {
  ...task,
  label: "task 2",
  __index: 1,
};

describe("the TaskEditor class", () => {
  const rpc = new MockRpc();

  afterEach(() => {
    resetTestVSCode();
    rpc.invokedMethod = undefined;
  });

  describe("setAnswers method", () => {
    it("Can be executed successfully without a task contributor", async () => {
      const appEvents = new MockAppEvents();
      const taskEditor = new TaskEditor(rpc, appEvents, {
        ...task,
        type: "unknown",
      });
      await taskEditor["onFrontendReady"]();
      await taskEditor["setAnswers"]({
        answers: { label: "task 1", prop1: "value2" },
      });
      expect(taskEditor["task"].prop1).eq("value2");
    });

    it("Uses defined task contributor to apply answers to the task", async () => {
      const appEvents = new MockAppEvents();
      const taskEditor = new TaskEditor(rpc, appEvents, {
        ...task,
        type: "testType",
      });
      await taskEditor["onFrontendReady"]();
      await taskEditor["setAnswers"]({
        answers: { label: "task 1", prop1: "value2" },
      });
      expect(taskEditor["task"].prop1).eq("value3");
      expect(taskEditor.isTaskChanged()).true;
      expect(taskEditor.getTask().label).eq("task 1");
    });

    it("Does not change readonly property", async () => {
      const appEvents = new MockAppEvents();
      const taskEditor = new TaskEditor(rpc, appEvents, {
        ...task,
        type: "testType",
      });
      await taskEditor["onFrontendReady"]();
      taskEditor["taskFrontendMirror"][0].guiOptions = { type: "label" };
      await taskEditor["setAnswers"]({
        answers: { prop1: "prop1", prop2: "value2" },
      });
      expect(taskEditor["task"].prop1).eq("value1");
    });

    it("Changes not readonly property (no gui options)", async () => {
      const appEvents = new MockAppEvents();
      const taskEditor = new TaskEditor(rpc, appEvents, {
        ...task,
        type: "testType",
      });
      await taskEditor["onFrontendReady"]();
      await taskEditor["setAnswers"]({
        answers: { prop1: "prop1", prop2: "value2" },
      });
      expect(taskEditor["task"].prop1).eq("value3");
    });

    it("Changes not readonly property (not `label` type on gui options)", async () => {
      const appEvents = new MockAppEvents();
      const taskEditor = new TaskEditor(rpc, appEvents, {
        ...task,
        type: "testType",
      });
      await taskEditor["onFrontendReady"]();
      taskEditor["taskFrontendMirror"][0].guiOptions = { type: "file-browser" };
      await taskEditor["setAnswers"]({
        answers: { prop1: "prop1", prop2: "value2" },
      });
      expect(taskEditor["task"].prop1).eq("value3");
    });

    it("Changes not readonly property (no type on guiOptions)", async () => {
      const appEvents = new MockAppEvents();
      const taskEditor = new TaskEditor(rpc, appEvents, {
        ...task,
        type: "testType",
      });
      await taskEditor["onFrontendReady"]();
      taskEditor["taskFrontendMirror"][0].guiOptions = { mandatory: true };
      await taskEditor["setAnswers"]({
        answers: { prop1: "prop1", prop2: "value2" },
      });
      expect(taskEditor["task"].prop1).eq("value3");
    });
  });

  describe("passTaskToFrontend method", () => {
    it("Uses default task converter if task contributor is not defined", async () => {
      const rpc = new MockRpc();
      const appEvents = new MockAppEvents();
      const taskEditor = new TaskEditor(rpc, appEvents, {
        ...task,
        type: "unknown",
      });
      await taskEditor["passTaskToFrontend"]();
      expect(rpc.invokedMethod).eq("setTask");
      const formInfo: any[] = rpc.params[0].content;
      expect(formInfo.length).eq(2);
      expect(formInfo[1].name).eq("prop1");
      expect(formInfo[1].message).eq("prop1");
      expect(formInfo[1].default).eq("value1");
      expect(formInfo[1].type).eq("input");
    });

    it("Uses defined task contributor for task conversion to form view", async () => {
      const appEvents = new MockAppEvents();
      const taskEditor = new TaskEditor(rpc, appEvents, {
        ...task,
        type: "testType",
      });
      await taskEditor["passTaskToFrontend"]();
      expect(rpc.invokedMethod).eq("setTask");
      expect(rpc.params[0]["taskImage"]).eq("image");
    });

    it("Does not update form if task frontend mirror is not changed", async () => {
      const appEvents = new MockAppEvents();
      const taskEditor = new TaskEditor(rpc, appEvents, {
        label: "task 1",
        type: "unknown",
        property1: "value 1",
      });
      taskEditor["taskFrontendMirror"] = [
        {
          name: "label",
          default: "task 1",
        },
        {
          name: "property1",
          default: "value 1",
        },
      ];
      await taskEditor["passTaskToFrontend"](true);
      expect(rpc.invokedMethod).to.be.undefined;
    });
  });

  describe("updateTaskFrontendMirror method", () => {
    it("sets default values of task fronted mirror that is cached in backend with values received from frontend", () => {
      const appEvents = new MockAppEvents();
      const taskEditor = new TaskEditor(rpc, appEvents, {
        ...task,
        type: "testType",
      });
      taskEditor["taskFrontendMirror"] = [
        {
          name: "label",
          default: "oldValue",
        },
        {
          name: "prop1",
          default: "prop1OldValue",
        },
      ];
      const answers = {
        label: "newValue",
      };
      taskEditor["updateTaskFrontendMirror"](answers);
      expect(taskEditor["taskFrontendMirror"][0].default).to.eq("newValue");
      expect(taskEditor["taskFrontendMirror"][1].default).to.eq("prop1OldValue");
    });
  });

  describe("isTaskFrontendMirrorChanged method", () => {
    let taskEditor: TaskEditor;
    before(() => {
      const rpc = new MockRpc();
      const appEvents = new MockAppEvents();
      taskEditor = new TaskEditor(rpc, appEvents, {
        ...task,
        type: "testType",
      });
      taskEditor["taskFrontendMirror"] = [
        {
          name: "label",
          default: "task 1",
        },
        {
          name: "property 1",
          default: "value 1",
        },
      ];
    });

    it("returns true if number of fields changed", () => {
      const updatedTask: TaskQuestion[] = [
        {
          name: "label",
          default: "task 1",
        },
        {
          name: "property 1",
          default: "value 1",
        },
        {
          name: "property 2",
          default: "value 2",
        },
      ];
      expect(taskEditor["isTaskFrontendMirrorChanged"](updatedTask)).to.be.true;
    });

    it("returns true if order of fields changed", () => {
      const updatedTask: TaskQuestion[] = [
        {
          name: "property 1",
          default: "value 1",
        },
        {
          name: "label",
          default: "task 1",
        },
      ];
      expect(taskEditor["isTaskFrontendMirrorChanged"](updatedTask)).to.be.true;
    });

    it("returns true if name of the field changed", () => {
      const updatedTask: TaskQuestion[] = [
        {
          name: "label",
          default: "task 1",
        },
        {
          name: "property 2",
          default: "value 1",
        },
      ];
      expect(taskEditor["isTaskFrontendMirrorChanged"](updatedTask)).to.be.true;
    });

    it("returns true if value of the field changed", () => {
      const updatedTask: TaskQuestion[] = [
        {
          name: "label",
          default: "task 1",
        },
        {
          name: "property 1",
          default: "value 2",
        },
      ];
      expect(taskEditor["isTaskFrontendMirrorChanged"](updatedTask)).to.be.true;
    });

    it("returns false if task image didn't change", () => {
      const updatedTask: TaskQuestion[] = [
        {
          name: "label",
          default: "task 1",
        },
        {
          name: "property 1",
          default: "value 1",
        },
      ];
      expect(taskEditor["isTaskFrontendMirrorChanged"](updatedTask)).to.be.false;
    });
  });

  describe("evaluateMethod method", () => {
    let sandbox: any;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- suppress rule
    let loggerWrapperMock: any;

    beforeEach(() => {
      sandbox = sinon.createSandbox();
      loggerWrapperMock = createLoggerWrapperMock(sandbox);
    });

    afterEach(() => {
      MockContributor.failOnValidate = false;
      resetLoggerMessage();
      sandbox.restore();
    });

    it("Returns undefined when called before frontend is ready", async () => {
      const appEvents = new MockAppEvents();
      const taskEditor = new TaskEditor(rpc, appEvents, {
        ...task,
        type: "testType",
      });
      expect(await taskEditor["evaluateMethod"]([{ prop1: "v" }], "prop1", "validate")).to.be.undefined;
    });

    it("Calls relevant function being called when frontend is ready", async () => {
      const appEvents = new MockAppEvents();
      const taskEditor = new TaskEditor(rpc, appEvents, {
        ...task,
        type: "testType",
      });
      await taskEditor["onFrontendReady"]();
      expect(await taskEditor["evaluateMethod"]([{ prop1: "v" }], "prop1", "validate")).to.eq(
        "Enter at least 2 characters",
      );
    });

    it("Calls function based of gui type being called when frontend is ready", async () => {
      const appEvents = new MockAppEvents();
      const taskEditor = new TaskEditor(rpc, appEvents, {
        ...task,
        type: "testType",
      });
      taskEditor.registerCustomQuestionEventHandler("file-browser", "getFilePath", mockOpenFileDialog);
      await taskEditor["onFrontendReady"]();
      expect(await taskEditor["evaluateMethod"]([{ prop2: "v" }], "prop2", "getFilePath")).to.eq("expectedPath");
    });

    it("Calls relevant function based of gui type when more than 1 handler defined for the same question type", async () => {
      const appEvents = new MockAppEvents();
      const taskEditor = new TaskEditor(rpc, appEvents, {
        ...task,
        type: "testType",
      });
      taskEditor.registerCustomQuestionEventHandler("file-browser", "method1", mockMethod1);
      taskEditor.registerCustomQuestionEventHandler("file-browser", "dialog", mockOpenFileDialog);
      await taskEditor["onFrontendReady"]();
      expect(await taskEditor["evaluateMethod"]([{ prop2: "v" }], "prop2", "method1")).to.eq("expectedValue");
    });

    it("Logs error when called with wrong question name", async () => {
      const appEvents = new MockAppEvents();
      const taskEditor = new TaskEditor(rpc, appEvents, {
        ...task,
        type: "testType",
      });
      taskEditor.registerCustomQuestionEventHandler("file-browser", "dialog", mockOpenFileDialog);
      await taskEditor["onFrontendReady"]();
      const params = [{ prop2: "v" }];
      expect(await taskEditor["evaluateMethod"](params, "propx", "dialog")).to.be.undefined;
      expect(getLoggerMessage()).to.include(messages.METHOD_NOT_FOUND("dialog", "propx", JSON.stringify(params)));
    });

    it("Returns undefined when called with wrong question", async () => {
      const appEvents = new MockAppEvents();
      const taskEditor = new TaskEditor(rpc, appEvents, {
        ...task,
        type: "testType",
      });
      await taskEditor["onFrontendReady"]();
      expect(await taskEditor["evaluateMethod"]([{ prop1: "v" }], "prop2", "validate")).to.eq(undefined);
    });

    it("Returns error when validate method failed with error", async () => {
      const appEvents = new MockAppEvents();
      const taskEditor = new TaskEditor(rpc, appEvents, {
        ...task,
        type: "testType",
      });
      MockContributor.failOnValidate = true;
      await taskEditor["onFrontendReady"]();
      await taskEditor["evaluateMethod"]([{ prop1: "v" }], "prop1", "validate");
      expect(getLoggerMessage()).to.include("Error: `validate` failed");
    });
  });

  it("saveTask method delegates execution to the AppEvents interface", async () => {
    const appEvents = new MockAppEvents();
    const taskEditor = new TaskEditor(rpc, appEvents, {
      ...task,
      type: "testType",
    });
    await taskEditor["saveTask"]();
    expect(appEvents.saveCalled).to.be.true;
  });

  it("saveTask method calls onSaveMethod of the task contributor if method is defined", async () => {
    const appEvents = new MockAppEvents();
    const taskEditor = new TaskEditor(rpc, appEvents, {
      ...task,
      type: "extendedTestType",
    });
    await taskEditor["saveTask"]();
    expect(appEvents.saveCalled).to.be.true;
    expect(MockContributorWithOnSave.onSaveCalled).to.be.true;
  });

  it("executeTask method calls executeTask method of AppEvents", async () => {
    const appEvents = new MockAppEvents();
    const taskEditor = new TaskEditor(rpc, appEvents, {
      ...task,
      type: "testType",
    });
    await taskEditor["executeTask"]();
    expect(appEvents.executeCalled).to.be.true;
  });

  describe("getTaskExecutionImage method provides image for any intent", () => {
    let sandbox: any;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- suppress rule
    let loggerWrapperMock: any;
    let extensionMock: sinon.SinonMock;

    beforeEach(() => {
      sandbox = sinon.createSandbox();
      loggerWrapperMock = createLoggerWrapperMock(sandbox);
      extensionMock = sinon.mock(extension);
    });

    afterEach(() => {
      sandbox.restore();
      extensionMock.verify();
    });

    it("task with intent Deploy has an image", () => {
      const appEvents = new MockAppEvents();
      const taskEditor = new TaskEditor(rpc, appEvents, {
        ...task,
        type: "testType",
        __intent: "Deploy",
      });
      extensionMock.expects("getExtensionPath").returns(path.resolve(__dirname, "..", ".."));
      expect(taskEditor["getTaskExecutionImage"]()).to.be.not.empty;
    });

    it("task with intent different from Deploy has an image", () => {
      const appEvents = new MockAppEvents();
      const taskEditor = new TaskEditor(rpc, appEvents, {
        ...task,
        type: "testType",
      });
      extensionMock.expects("getExtensionPath").returns(path.resolve(__dirname, "..", ".."));
      expect(taskEditor["getTaskExecutionImage"]()).to.be.not.empty;
    });

    it("Returns error when `getImage` method failed with error", () => {
      const appEvents = new MockAppEvents();
      const taskEditor = new TaskEditor(rpc, appEvents, {
        ...task,
        type: "testType",
      });
      extensionMock.expects("getExtensionPath").returns(path.resolve(__dirname, "..", "wrong"));
      expect(taskEditor["getTaskExecutionImage"]()).to.be.empty;
      expect(getLoggerMessage()).to.include(`was not found!`);
    });
  });

  describe("setLabelValidator method", () => {
    it("sets validator that checks only label uniqueness when no validation function defined on the property `label` of the task", async () => {
      const appEvents = new MockAppEvents();
      const taskEditor = new TaskEditor(rpc, appEvents, {
        ...task,
        type: "testType",
      });
      const frontendTask = [
        {
          name: "label",
        },
      ];
      taskEditor["setLabelValidator"](frontendTask);
      expect(frontendTask[0]["validate"]).to.exist;
      expect(await frontendTask[0]["validate"]("task 2")).to.be.true;
    });

    describe("getExecutionIntent", () => {
      it("returns `Build` when intent of the task is `Build`", () => {
        const appEvents = new MockAppEvents();
        const taskEditor = new TaskEditor(rpc, appEvents, {
          ...task,
          type: "testType",
          __intent: "Build",
        });
        expect(taskEditor["getExecutionIntent"]()).to.eq("Build");
      });

      it("returns `Deploy` when intent of the task is `Deploy`", () => {
        const appEvents = new MockAppEvents();
        const taskEditor = new TaskEditor(rpc, appEvents, {
          ...task,
          type: "testType",
          __intent: "Deploy",
        });
        expect(taskEditor["getExecutionIntent"]()).to.eq("Deploy");
      });

      it("returns `Execute` when intent of the task not equals `Build` or `Deploy`", () => {
        const appEvents = new MockAppEvents();
        const taskEditor = new TaskEditor(rpc, appEvents, {
          ...task,
          type: "testType",
          __intent: "other",
        });
        expect(taskEditor["getExecutionIntent"]()).to.eq("Run");
      });
    });

    describe("sets validator that checks label uniqueness after call to original validation function defined on the property `label` of the task", () => {
      let taskEditor: TaskEditor;
      let frontendTask: any;

      before(async () => {
        const appEvents = new MockAppEvents();
        taskEditor = new TaskEditor(rpc, appEvents, {
          ...task,
          type: "testType",
        });
        frontendTask = [
          {
            name: "label",
            validate: function (value: string): string | boolean {
              return value === "error" ? "wrong value" : true;
            },
          },
        ];
        taskEditor["setLabelValidator"](frontendTask);
        testVscode.workspace.workspaceFolders = [{ uri: { path: "path" } }];
        MockVSCodeInfo.configTasks?.set("path", [task, task2]);
        // the following code sets configured tasks cache that is used in labels uniqueness check
        const taskTypesProvider = new MockTaskTypeProvider();
        const taskProvider = new TasksProvider(taskTypesProvider);
        await taskProvider.getConfiguredTasks();
      });

      it("original validator fails on wrong value", async () => {
        expect(await frontendTask[0]["validate"]("error")).to.eq("wrong value");
      });

      it("original validator succeeds and uniqueness check succeeds too", async () => {
        expect(await frontendTask[0]["validate"]("new task")).to.be.true;
      });

      it("original validator succeeds but uniqueness fails", async () => {
        expect(await frontendTask[0]["validate"]("task 2")).to.eq(messages.LABEL_IS_NOT_UNIQUE());
      });
    });
  });
});

async function mockOpenFileDialog(): Promise<string> {
  return "expectedPath";
}

async function mockMethod1(): Promise<string> {
  return "expectedValue";
}
