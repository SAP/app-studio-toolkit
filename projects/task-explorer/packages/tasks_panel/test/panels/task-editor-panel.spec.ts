/* eslint-disable eslint-comments/disable-enable-pair -- disable the next rule */
/* eslint-disable @typescript-eslint/no-non-null-assertion -- suppress this rule for test scope */
import { expect } from "chai";
import { mockVscode, MockVSCodeInfo, resetTestVSCode } from "../utils/mockVSCode";
mockVscode("../../src/panels/task-editor-panel");
import { createTaskEditorPanel, disposeTaskEditorPanel, getTaskEditorPanel } from "../../src/panels/panels-handler";
import { TaskEditorPanel } from "../../src/panels/task-editor-panel";

describe("TaskEditorPanel class", () => {
  let viewInitiated = false;
  const readFile = async function (): Promise<string> {
    viewInitiated = true;
    return "aaa";
  };

  afterEach(() => {
    disposeTaskEditorPanel();
    resetTestVSCode();
    viewInitiated = false;
  });

  describe("loadWebviewPanel method", () => {
    it("disposes existing web view panel before loading a new one", async () => {
      const task = {
        label: "aaa",
        type: "testType",
      };
      await createTaskEditorPanel(task, readFile);
      const panel = getTaskEditorPanel();
      expect(panel).exist;
      panel!.loadWebviewPanel({ task: task });
      expect(MockVSCodeInfo.disposeCalled).to.be.true;
    });
  });

  describe("initWebviewPanel method", () => {
    it("does nothing if web view panel is undefined", async () => {
      const task = {
        label: "aaa",
        type: "testType",
      };
      const panel = new TaskEditorPanel(task, readFile);
      panel["webViewPanel"] = undefined;
      await panel.initWebviewPanel();
      expect(viewInitiated).to.be.false;
    });

    it("sets callback for event onDidChangeViewState, that runs command `setContext` if web view panel is defined", async () => {
      const task = {
        label: "aaa",
        type: "testType",
      };
      const panel = new TaskEditorPanel(task, readFile);
      await panel.initWebviewPanel();
      MockVSCodeInfo.commandCalled = "";
      MockVSCodeInfo.changeViewStateCallback();
      expect(MockVSCodeInfo.commandCalled).to.eq("setContext");
    });

    it("sets callback for event onDidChangeViewState, that does not run command `setContext` if view panel is undefined", async () => {
      const task = {
        label: "aaa",
        type: "testType",
      };
      const panel = new TaskEditorPanel(task, readFile);
      await panel.initWebviewPanel();
      panel["webViewPanel"] = undefined;
      MockVSCodeInfo.commandCalled = "";
      MockVSCodeInfo.changeViewStateCallback();
      expect(MockVSCodeInfo.commandCalled).to.eq("");
    });
  });

  describe("createNewInstance method", () => {
    it("creates an instance on the first instantiation", async () => {
      await createTaskEditorPanel(
        {
          label: "aaa",
          type: "testType",
        },
        readFile,
      );
      const panel = getTaskEditorPanel();
      expect(panel).to.exist;
    });

    it("resets instance of task editor when disposing", async () => {
      await createTaskEditorPanel(
        {
          label: "task1",
          type: "testType",
        },
        readFile,
      );
      const panel = getTaskEditorPanel();
      expect(panel).to.exist;
      expect(panel!["taskEditor"]).to.exist;
      MockVSCodeInfo.disposeCallback();
      expect(panel!["taskEditor"]).to.be.undefined;
    });

    it("creates an instance on each instantiation, disposing the previous instance", async () => {
      await createTaskEditorPanel(
        {
          label: "aaa",
          type: "testType",
        },
        readFile,
      );
      const panel1 = getTaskEditorPanel();
      expect(panel1).exist;
      await createTaskEditorPanel(
        {
          label: "aaa1",
          type: "testType",
        },
        readFile,
      );
      const panel2 = getTaskEditorPanel();
      expect(panel2).to.exist;
      expect(panel2).to.not.eq(panel1);
    });

    it("verify a two created instances are the same instance if they are created with the same task", async () => {
      await createTaskEditorPanel(
        {
          label: "aaa",
          type: "testType",
        },
        readFile,
      );
      const panel1 = getTaskEditorPanel();
      expect(panel1).exist;
      await createTaskEditorPanel(
        {
          label: "aaa",
          type: "testType",
        },
        readFile,
      );
      const panel2 = getTaskEditorPanel();
      expect(panel2).to.exist;
      expect(panel2).to.eq(panel1);
    });
  });

  describe("getTaskEditor method", () => {
    it("getTaskEditor method returns undefined if called before TaskEditorPanel instantiation", () => {
      expect(getTaskEditorPanel()).to.be.undefined;
    });
  });

  describe("showOpenFileDialog method", () => {
    it("opens file dialog", async () => {
      await createTaskEditorPanel(
        {
          label: "aaa",
          type: "testType",
        },
        readFile,
      );
      const panel = getTaskEditorPanel();
      panel!.showOpenFileDialog("");
      expect(MockVSCodeInfo.dialogCalled).to.be.true;
    });
  });

  describe("showOpenFolderleDialog method", () => {
    it("opens file dialog", async () => {
      await createTaskEditorPanel(
        {
          label: "aaa",
          type: "testType",
        },
        readFile,
      );
      const panel = getTaskEditorPanel();
      expect(panel).exist;
      panel!.showOpenFolderDialog("");
      expect(MockVSCodeInfo.dialogCalled).to.be.true;
    });
  });

  describe("getTaskInProcess method", () => {
    it("returns task label if task changed and not saved yet", async () => {
      await createTaskEditorPanel(
        {
          label: "task1",
          type: "testType",
        },
        readFile,
      );
      const panel = getTaskEditorPanel();
      expect(panel).exist;
      panel!["taskEditor"]!["changed"] = true;
      expect(panel!.getTaskInProcess()).to.eq("task1");
    });

    it("returns undefined if task not changed", async () => {
      await createTaskEditorPanel(
        {
          label: "task1",
          type: "testType",
        },
        readFile,
      );
      const panel = getTaskEditorPanel();
      expect(panel).exist;
      expect(panel!.getTaskInProcess()).to.be.undefined;
    });

    it("returns undefined if task editor is undefined", async () => {
      await createTaskEditorPanel(
        {
          label: "task1",
          type: "testType",
        },
        readFile,
      );
      const panel = getTaskEditorPanel();
      expect(panel).exist;
      panel!["taskEditor"] = undefined;
      expect(panel!.getTaskInProcess()).to.be.undefined;
    });
  });
});
