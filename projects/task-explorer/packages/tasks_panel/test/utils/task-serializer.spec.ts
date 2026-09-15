import {
  exceptionToString,
  getUniqueTaskLabel,
  serializeTask,
  updateTasksConfiguration,
} from "../../src/utils/task-serializer";
import { MockVSCodeInfo, mockVscode, resetTestVSCode, testVscode } from "./mockVSCode";
import { expect } from "chai";
import * as provider from "../../src/services/tasks-provider";
import { ConfiguredTask } from "@sap_oss/task_contrib_types";
import { SinonMock, SinonStub, mock, stub } from "sinon";
import { languages } from "vscode";

mockVscode("src/utils/task-serializer");

describe("task-serializer scope", () => {
  afterEach(() => {
    resetTestVSCode();
  });

  it("loading of serialized task data succeeded", () => {
    const task: ConfiguredTask = { label: "label", type: "type", __intent: "intent" };
    expect(JSON.parse(serializeTask(task))).to.deep.equal(task);
  });

  describe("getUniqueTaskLabel method", () => {
    let mockConfiguredTasks: SinonMock;
    beforeEach(() => {
      mockConfiguredTasks = mock(provider);
    });

    afterEach(() => {
      mockConfiguredTasks.verify();
    });

    it("returns input value if it's unique", () => {
      mockConfiguredTasks.expects("getConfiguredTasksFromCache").returns([{ label: "label" }]);
      expect(getUniqueTaskLabel("newTask")).to.eq("newTask");
    });

    it("returns input value with suffix (2) if it's not unique", () => {
      mockConfiguredTasks.expects("getConfiguredTasksFromCache").returns([{ label: "label" }]);
      expect(getUniqueTaskLabel("label")).to.eq("label (2)");
    });

    it("returns input value with suffix (2) if it's not unique and contains special characters", () => {
      mockConfiguredTasks.expects("getConfiguredTasksFromCache").returns([{ label: "task (1) /path" }]);
      expect(getUniqueTaskLabel("task (1) /path")).to.eq("task (1) /path (2)");
    });

    it("returns input value with suffix (3) if 2 similar tasks found", () => {
      mockConfiguredTasks
        .expects("getConfiguredTasksFromCache")
        .returns([{ label: "task 3" }, { label: "task 3 (2)" }]);
      expect(getUniqueTaskLabel("task 3")).to.eq("task 3 (3)");
    });

    it("returns input value looking similar to existing but having some prefix", () => {
      mockConfiguredTasks
        .expects("getConfiguredTasksFromCache")
        .returns([{ label: "task 3" }, { label: "task 3 (2)" }]);
      expect(getUniqueTaskLabel("my task 3")).to.eq("my task 3");
    });

    it("returns input value looking similar to existing but having some suffix", () => {
      mockConfiguredTasks
        .expects("getConfiguredTasksFromCache")
        .returns([{ label: "task 3" }, { label: "task 3 (2)" }]);
      expect(getUniqueTaskLabel("task 3 (2).")).to.eq("task 3 (2).");
    });

    it("returns input value with suffix (11) if similar task with suffix (10) found", () => {
      mockConfiguredTasks
        .expects("getConfiguredTasksFromCache")
        .returns([{ label: "task 3" }, { label: "task 3 (10)" }]);
      expect(getUniqueTaskLabel("task 3")).to.eq("task 3 (11)");
    });
  });

  describe("updateTasksConfiguration method", () => {
    let stubLanguages: SinonStub;
    let mockWindow: SinonMock;
    let mockCommands: SinonMock;
    beforeEach(() => {
      stubLanguages = stub(languages, "onDidChangeDiagnostics").returns({ dispose: () => true });
      mockWindow = mock(testVscode.window);
      mockCommands = mock(testVscode.commands);
    });

    afterEach(() => {
      stubLanguages.restore();
      mockWindow.verify();
      mockCommands.verify();
    });

    const wsFolder = "/my/folder";
    const task = { label: "label", type: "type" };
    const docPath = testVscode.Uri.joinPath(testVscode.Uri.file(wsFolder), ".vscode", "tasks.json").path;

    it("updateTasksConfiguration called, onDidChangeDiagnostics not triggered", () => {
      updateTasksConfiguration(wsFolder, [task]);
      expect(MockVSCodeInfo.configTasks?.get(wsFolder)).to.deep.equal([task]);
      expect(MockVSCodeInfo.updateCalled.section).to.be.equal("tasks");
      expect(MockVSCodeInfo.updateCalled.configurationTarget).to.be.equal(
        testVscode.ConfigurationTarget.WorkspaceFolder,
      );
    });

    it("updateTasksConfiguration called, onDidChangeDiagnostics triggered, but for unlistened folders", async () => {
      updateTasksConfiguration(wsFolder, [task]);
      const callback: (c) => Promise<void> = stubLanguages.args[0][0];
      await callback({ uris: [{ path: "/my/folder/other/file.json" }] });
    });

    it("updateTasksConfiguration called, onDidChangeDiagnostics triggered, do not show problem selected", async () => {
      updateTasksConfiguration(wsFolder, [task]);
      const callback: (c) => Promise<void> = stubLanguages.args[0][0];
      await callback({ uris: [{ path: docPath }] });
    });

    // open this test when support to the 'onDidChangeDiagnostics' of problem view will be implemented
    it.skip("updateTasksConfiguration called, onDidChangeDiagnostics triggered, open problem view", async () => {
      mockWindow
        .expects("showWarningMessage")
        .withExactArgs(`There are tasks definitions errors. See the problems for details.`, "Show problems")
        .resolves("Show problems");
      mockWindow.expects("showTextDocument").resolves("Show problems");
      mockCommands.expects("executeCommand").withExactArgs("workbench.actions.view.problems").resolves(true);
      updateTasksConfiguration(wsFolder, [task]);
      const callback: (c) => Promise<void> = stubLanguages.args[0][0];
      await callback({ uris: [{ path: docPath }] });
    });
  });

  describe("exceptionToString method scope", () => {
    it("Error type exception cathed", () => {
      const err = new Error("error");
      expect(exceptionToString(err)).to.equal(err.toString());
    });

    it("Empty object catched", () => {
      expect(exceptionToString(Object.create(null))).to.equal("unknown error");
    });

    it("undefined value catched", () => {
      expect(exceptionToString(undefined)).to.equal("unknown error");
    });
  });
});
