import { vscode } from "./mockUtil.js";
import { expect } from "chai";
import { createSandbox, SinonSandbox, SinonMock } from "sinon";
import _ from "lodash";
import type {
  IMethod,
  IPromiseCallbacks,
  IRpc,
} from "@sap-devx/webview-rpc/out.ext/rpc-common.js";
import * as messages from "../src/messages.js";
import { MessageType, Severity, IBannerProps } from "@sap-devx/yeoman-ui-types";
import { GeneratorOutput } from "../src/vscode-output.js";
import { Constants } from "../src/utils/constants.js";
import * as loggerWrapper from "../src/logger/logger-wrapper.js";
import { VSCodeYouiEvents } from "../src/vscode-youi-events.js";
import { WorkspaceFile } from "../src/utils/workspaceFile.js";
import * as fs from "fs";

describe("vscode-youi-events unit test", () => {
  let events: VSCodeYouiEvents;
  let sandbox: SinonSandbox;
  let windowMock: SinonMock;
  let commandsMock: SinonMock;
  let workspaceMock: SinonMock;
  let eventsMock: SinonMock;
  let generatorOutputMock: SinonMock;
  let rpcMock: SinonMock;
  let loggerMock: SinonMock;
  let uriMock: SinonMock;
  let fsMock: SinonMock;
  let wsFileMockUri: any;

  const testLogger = {
    debug: () => true,
    error: () => true,
    fatal: () => true,
    warn: () => true,
    info: () => true,
    trace: () => true,
    getChildLogger: () => {
      return testLogger;
    },
  };

  class TestRpc implements IRpc {
    public timeout: number;
    public promiseCallbacks: Map<number, IPromiseCallbacks>;
    public methods: Map<string, IMethod>;
    public sendRequest(): void {
      return;
    }
    public sendResponse(): void {
      return;
    }
    public setResponseTimeout(): void {
      return;
    }
    public registerMethod(): void {
      return;
    }
    public unregisterMethod(): void {
      return;
    }
    public listLocalMethods(): string[] {
      return [];
    }
    public handleResponse(): void {
      return;
    }
    public listRemoteMethods(): Promise<string[]> {
      return Promise.resolve([]);
    }
    public invoke(): Promise<any> {
      return Promise.resolve();
    }
    public handleRequest(): Promise<void> {
      return Promise.resolve();
    }
  }
  const rpc = new TestRpc();
  const generatorOutput = new GeneratorOutput();

  before(() => {
    sandbox = createSandbox();
    loggerWrapper.internalApi.setLogger(testLogger);
  });

  after(() => {
    loggerWrapper.internalApi.resetLogger();
  });

  beforeEach(() => {
    const webViewPanel: any = { dispose: () => true };
    events = new VSCodeYouiEvents(
      rpc,
      webViewPanel,
      messages.default,
      generatorOutput
    );
    windowMock = sandbox.mock(vscode.window);
    commandsMock = sandbox.mock(vscode.commands);
    workspaceMock = sandbox.mock(vscode.workspace);
    eventsMock = sandbox.mock(events);
    generatorOutputMock = sandbox.mock(generatorOutput);
    loggerMock = sandbox.mock(testLogger);
    rpcMock = sandbox.mock(rpc);
    uriMock = sandbox.mock(vscode.Uri);
    fsMock = sandbox.mock(fs);
    wsFileMockUri = vscode.Uri.file("/tmp/workspace.code-workspace");
    sandbox.stub(WorkspaceFile, "createWsWithPath").returns(wsFileMockUri);
    sandbox.stub(WorkspaceFile, "createWsWithUri").returns(wsFileMockUri);
    // Default stub for workspace.getConfiguration - returns true for showGeneratorProgress
    sandbox.stub(vscode.workspace, "getConfiguration").returns({
      get: sandbox.stub().returns(true),
    } as any);
  });

  afterEach(() => {
    windowMock.verify();
    eventsMock.verify();
    commandsMock.verify();
    workspaceMock.verify();
    generatorOutputMock.verify();
    loggerMock.verify();
    rpcMock.verify();
    uriMock.verify();
    fsMock.verify();
    sandbox.restore();
    sandbox = createSandbox();
    loggerWrapper.internalApi.setLogger(testLogger);
  });

  describe("getAppWizard", () => {
    it("error notification message on BAS", () => {
      const message = "error notification message";
      Constants["IS_IN_BAS"] = true;
      const appWizard = events.getAppWizard();
      generatorOutputMock.expects("appendLine").withExactArgs(message);
      windowMock.expects("showErrorMessage").withExactArgs(message);
      appWizard.showError(message, MessageType.notification);
    });

    it("warning notification message on BAS", () => {
      const message = "warning notification message";
      Constants["IS_IN_BAS"] = true;
      const appWizard = events.getAppWizard();
      generatorOutputMock.expects("appendLine").withExactArgs(message);
      windowMock.expects("showWarningMessage").withExactArgs(message);
      appWizard.showWarning(message, MessageType.notification);
    });

    it("information notification message on BAS", () => {
      const message = "information notification message";
      Constants["IS_IN_BAS"] = true;
      const appWizard = events.getAppWizard();
      generatorOutputMock.expects("appendLine").withExactArgs(message);
      windowMock.expects("showInformationMessage").withExactArgs(message);
      appWizard.showInformation(message, MessageType.notification);
    });

    it("error prompt message on BAS", () => {
      const message = "error prompt message";
      Constants["IS_IN_BAS"] = true;
      const appWizard = events.getAppWizard();
      generatorOutputMock.expects("appendLine").withExactArgs(message);
      events["getMessageImage"] = () => "errorTheia";
      rpcMock
        .expects("invoke")
        .withExactArgs("showPromptMessage", [
          message,
          Severity.error,
          "errorTheia",
        ]);
      appWizard.showError(message, MessageType.prompt);
    });

    it("warning prompt message on BAS", () => {
      const message = "warning prompt message";
      Constants["IS_IN_BAS"] = true;
      const appWizard = events.getAppWizard();
      generatorOutputMock.expects("appendLine").withExactArgs(message);
      events["getMessageImage"] = () => "warnTheia";
      rpcMock
        .expects("invoke")
        .withExactArgs("showPromptMessage", [
          message,
          Severity.warning,
          "warnTheia",
        ]);
      appWizard.showWarning(message, MessageType.prompt);
    });

    it("information prompt message on BAS", () => {
      const message = "information prompt message";
      Constants["IS_IN_BAS"] = true;
      const appWizard = events.getAppWizard();
      generatorOutputMock.expects("appendLine").withExactArgs(message);
      events["getMessageImage"] = () => "infoTheia";
      rpcMock
        .expects("invoke")
        .withExactArgs("showPromptMessage", [
          message,
          Severity.information,
          "infoTheia",
        ]);
      appWizard.showInformation(message, MessageType.prompt);
    });

    it("error message with location prompt on vscode", () => {
      const message = "error prompt message";
      Constants["IS_IN_BAS"] = false;
      const appWizard = events.getAppWizard();
      events["getMessageImage"] = () => "errorVSCodeDark";
      generatorOutputMock.expects("appendLine").withExactArgs(message);
      rpcMock
        .expects("invoke")
        .withExactArgs("showPromptMessage", [
          message,
          Severity.error,
          "errorVSCodeDark",
        ]);
      appWizard.showError(message, MessageType.prompt);
    });

    it("warning message with location prompt on vscode", () => {
      const message = "warning prompt message";
      Constants["IS_IN_BAS"] = false;
      const appWizard = events.getAppWizard();
      events["getMessageImage"] = () => "warnVSCode";
      generatorOutputMock.expects("appendLine").withExactArgs(message);
      rpcMock
        .expects("invoke")
        .withExactArgs("showPromptMessage", [
          message,
          Severity.warning,
          "warnVSCode",
        ]);
      appWizard.showWarning(message, MessageType.prompt);
    });

    it("info message with location prompt on vscode", () => {
      const message = "information prompt message";
      Constants["IS_IN_BAS"] = false;
      const appWizard = events.getAppWizard();
      events["getMessageImage"] = () => "infoVSCode";
      generatorOutputMock.expects("appendLine").withExactArgs(message);
      rpcMock
        .expects("invoke")
        .withExactArgs("showPromptMessage", [
          message,
          Severity.information,
          "infoVSCode",
        ]);
      appWizard.showInformation(message, MessageType.prompt);
    });
  });

  it("executeCommand", () => {
    const commandId = "vscode.open";
    const commandArgs = [vscode.Uri.file("https://en.wikipedia.org")];
    commandsMock
      .expects("executeCommand")
      .withExactArgs(commandId, ...commandArgs)
      .resolves();
    return events.executeCommand(commandId, commandArgs);
  });

  it("doGeneratorInstall", () => {
    _.set(vscode, "ProgressLocation.Notification", 15);
    let progressCallback: any;
    windowMock
      .expects("withProgress")
      .withArgs({
        location: 15,
        title: "Installing dependencies...",
        cancellable: false,
      })
      .callsFake((options: any, callback: any) => {
        progressCallback = callback;
        return Promise.resolve();
      });
    events.doGeneratorInstall();
    // Verify callback was captured
    expect(progressCallback).to.not.be.undefined;
  });

  it("doGeneratorInstall - withProgress callback execution", async () => {
    _.set(vscode, "ProgressLocation.Notification", 15);
    let progressReporter: any;
    windowMock
      .expects("withProgress")
      .withArgs({
        location: 15,
        title: "Installing dependencies...",
        cancellable: false,
      })
      .callsFake((options: any, callback: any) => {
        progressReporter = {
          report: sandbox.stub(),
        };
        const result = callback(progressReporter);
        // Resolve after a brief delay to allow async code to run
        setTimeout(() => {
          events["resolveInstallingProgress"]();
        }, 10);
        return result;
      });
    events.doGeneratorInstall();
    // Wait for async operations
    await new Promise((resolve) => setTimeout(resolve, 50));
  });

  describe("doGeneratorProgress", () => {
    it("backward compatibility: showProgress=false on install phase calls doGeneratorInstall", () => {
      _.set(vscode, "ProgressLocation.Notification", 15);
      eventsMock.expects("doClose").once();
      windowMock
        .expects("withProgress")
        .withArgs({
          location: 15,
          title: "Installing dependencies...",
          cancellable: false,
        })
        .resolves();

      // Should fall back to classic behavior
      events.doGeneratorProgress("testProject", "install", false);
    });

    it("backward compatibility: showProgress=false on writing phase does nothing", () => {
      // Should not call doClose or withProgress
      eventsMock.expects("doClose").never();
      windowMock.expects("withProgress").never();

      events.doGeneratorProgress("testProject", "writing", false);
    });

    it("backward compatibility: showProgress=false on end phase does nothing", () => {
      // Should not call doClose or withProgress
      eventsMock.expects("doClose").never();
      windowMock.expects("withProgress").never();

      events.doGeneratorProgress("testProject", "end", false);
    });

    it("backward compatibility: showProgress=true but setting disabled, falls back to classic on install", () => {
      // Override the default stub to return false for the setting
      (vscode.workspace.getConfiguration as any).returns({
        get: sandbox
          .stub()
          .withArgs("ApplicationWizard.showGeneratorProgress", true)
          .returns(false),
      });
      eventsMock.expects("doGeneratorInstall").once();

      events.doGeneratorProgress("testProject", "install", true);
    });

    it("backward compatibility: showProgress=true but setting disabled, does nothing on writing", () => {
      // Override the default stub to return false for the setting
      (vscode.workspace.getConfiguration as any).returns({
        get: sandbox
          .stub()
          .withArgs("ApplicationWizard.showGeneratorProgress", true)
          .returns(false),
      });
      eventsMock.expects("doGeneratorInstall").never();
      windowMock.expects("withProgress").never();

      events.doGeneratorProgress("testProject", "writing", true);
    });

    it("setting enabled: showProgress=true enters enhanced mode", () => {
      _.set(vscode, "ProgressLocation.Notification", 15);
      // Default stub already returns true, so no need to override
      eventsMock.expects("doClose").once();
      windowMock
        .expects("withProgress")
        .withArgs({
          location: 15,
          title: "Generating testProject",
          cancellable: false,
        })
        .resolves();

      events.doGeneratorProgress("testProject", "writing", true);
    });

    it("enhanced mode: showProgress=true on writing phase shows progress with project name", () => {
      _.set(vscode, "ProgressLocation.Notification", 15);
      eventsMock.expects("doClose").once();
      windowMock
        .expects("withProgress")
        .withArgs({
          location: 15,
          title: "Generating testProject",
          cancellable: false,
        })
        .resolves();

      events.doGeneratorProgress("testProject", "writing", true);
    });

    it("enhanced mode: showProgress=true on writing phase with no project name", () => {
      _.set(vscode, "ProgressLocation.Notification", 15);
      eventsMock.expects("doClose").once();
      windowMock
        .expects("withProgress")
        .withArgs({
          location: 15,
          title: "Generating...",
          cancellable: false,
        })
        .resolves();

      events.doGeneratorProgress(undefined, "writing", true);
    });

    it("enhanced mode: can start with install phase (not just writing)", () => {
      _.set(vscode, "ProgressLocation.Notification", 15);
      eventsMock.expects("doClose").once();
      windowMock
        .expects("withProgress")
        .withArgs({
          location: 15,
          title: "Generating testProject",
          cancellable: false,
        })
        .resolves();

      // Starting with install phase should still initialize enhanced mode
      events.doGeneratorProgress("testProject", "install", true);
    });

    it("enhanced mode: can start with end phase", () => {
      _.set(vscode, "ProgressLocation.Notification", 15);
      eventsMock.expects("doClose").once();
      windowMock
        .expects("withProgress")
        .withArgs({
          location: 15,
          title: "Generating testProject",
          cancellable: false,
        })
        .resolves();

      // Starting with end phase should still initialize enhanced mode
      events.doGeneratorProgress("testProject", "end", true);
    });

    it("enhanced mode: phase transition with remaining time - setTimeout path", async () => {
      _.set(vscode, "ProgressLocation.Notification", 15);
      let progressReporter: any;
      let resolveProgress: any;

      windowMock
        .expects("withProgress")
        .callsFake((options: any, callback: any) => {
          progressReporter = {
            report: sandbox.stub(),
          };
          const result = callback(progressReporter);
          resolveProgress = () => events["resolveInstallingProgress"]();
          return result;
        });

      eventsMock.expects("doClose").once();

      // Start with writing phase
      events.doGeneratorProgress("testProject", "writing", true);

      // Wait for progress reporter to be set
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Immediately transition to install phase (before minimum duration)
      // This should trigger the setTimeout path (lines 180-191)
      events.doGeneratorProgress("testProject", "install", true);

      // Wait for setTimeout to execute
      await new Promise((resolve) => setTimeout(resolve, 2100));

      // Verify progress.report was called with install message
      expect(progressReporter.report.called).to.be.true;

      // Clean up
      resolveProgress();
    });

    it("enhanced mode: phase transition after minimum duration - immediate path", async () => {
      _.set(vscode, "ProgressLocation.Notification", 15);
      let progressReporter: any;
      let resolveProgress: any;

      windowMock
        .expects("withProgress")
        .callsFake((options: any, callback: any) => {
          progressReporter = {
            report: sandbox.stub(),
          };
          const result = callback(progressReporter);
          resolveProgress = () => events["resolveInstallingProgress"]();
          return result;
        });

      eventsMock.expects("doClose").once();

      // Start with install phase (minimum duration = 0)
      events.doGeneratorProgress("testProject", "install", true);

      // Wait for progress reporter to be set
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Transition to end phase - should take immediate path (lines 193-197)
      events.doGeneratorProgress("testProject", "end", true);

      // Verify progress.report was called immediately
      expect(progressReporter.report.called).to.be.true;

      // Clean up
      resolveProgress();
    });

    it("enhanced mode: cancels pending timer on new phase transition", async () => {
      _.set(vscode, "ProgressLocation.Notification", 15);
      let progressReporter: any;
      let resolveProgress: any;

      windowMock
        .expects("withProgress")
        .callsFake((options: any, callback: any) => {
          progressReporter = {
            report: sandbox.stub(),
          };
          const result = callback(progressReporter);
          resolveProgress = () => events["resolveInstallingProgress"]();
          return result;
        });

      eventsMock.expects("doClose").once();

      // Start with writing phase (minimum duration = 2000ms)
      events.doGeneratorProgress("testProject", "writing", true);
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Transition to install (this schedules a timer)
      events.doGeneratorProgress("testProject", "install", true);

      // Verify pendingPhaseTimer is set
      expect(events["pendingPhaseTimer"]).to.not.be.null;

      // Immediately transition to end phase (should cancel previous timer)
      events.doGeneratorProgress("testProject", "end", true);

      // Wait less than the original timer duration
      await new Promise((resolve) => setTimeout(resolve, 100));

      // The timer should have been canceled and replaced
      // Clean up
      resolveProgress();
    });

    it("enhanced mode: clears timer during cleanup in showInstallMessage", async () => {
      _.set(vscode, "ProgressLocation.Notification", 15);
      let progressReporter: any;

      windowMock
        .expects("withProgress")
        .callsFake((options: any, callback: any) => {
          progressReporter = {
            report: sandbox.stub(),
          };
          return callback(progressReporter).then(() => {
            // Verify timer was cleared during cleanup
            expect(events["pendingPhaseTimer"]).to.be.null;
          });
        });

      eventsMock.expects("doClose").once();

      // Start with writing phase
      events.doGeneratorProgress("testProject", "writing", true);
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Schedule a phase transition (creates a timer)
      events.doGeneratorProgress("testProject", "install", true);

      // Verify timer exists
      expect(events["pendingPhaseTimer"]).to.not.be.null;

      // Resolve the progress (triggers cleanup)
      events["resolveInstallingProgress"]();

      await new Promise((resolve) => setTimeout(resolve, 10));
    });
  });

  it("setAppWizardHeaderTitle", () => {
    const testTitle = "testTitle";
    const testInfo = "testInfo";
    rpcMock
      .expects("invoke")
      .withExactArgs("setHeaderTitle", [testTitle, testInfo]);
    events.setAppWizardHeaderTitle(testTitle, testInfo);
  });

  it("setBanner", () => {
    const bannerProps: IBannerProps = {
      text: "Test Banner",
      ariaLabel: "Test Banner Label",
      displayBannerForStep: "testStep",
      icon: { source: "mdi-check-circle", type: "mdi" },
      action: { text: "Click Me", url: "https://example.com" },
      triggerActionFrom: "banner",
    };
    rpcMock.expects("invoke").withExactArgs("setBanner", [bannerProps]);
    events.setAppWizardBanner(bannerProps);
  });

  describe("showProgress", () => {
    it("getAppWizard - no message received ---> show default Information message with Progress button", () => {
      const appWizard = events.getAppWizard();
      loggerMock.expects("debug");
      generatorOutputMock.expects("appendLine");
      windowMock
        .expects("showInformationMessage")
        .withExactArgs(
          messages.default.show_progress_message,
          messages.default.show_progress_button
        )
        .resolves();
      appWizard.showProgress();
    });

    it("no message received ---> show default Information message with Progress button", () => {
      loggerMock.expects("debug");
      generatorOutputMock.expects("appendLine");
      windowMock
        .expects("showInformationMessage")
        .withExactArgs(
          messages.default.show_progress_message,
          messages.default.show_progress_button
        )
        .resolves();
      events.showProgress();
    });

    it("message received ---> show Information message with received message and Progress button", () => {
      const message = "Generating generator";
      loggerMock.expects("debug");
      generatorOutputMock.expects("appendLine");
      windowMock
        .expects("showInformationMessage")
        .withExactArgs(message, messages.default.show_progress_button)
        .resolves();
      events.showProgress(message);
    });

    it("Progress button pressed ---> show Output", () => {
      loggerMock.expects("debug");
      loggerMock.expects("trace");
      generatorOutputMock.expects("appendLine");
      windowMock
        .expects("showInformationMessage")
        .withExactArgs(
          messages.default.show_progress_message,
          messages.default.show_progress_button
        )
        .resolves(messages.default.show_progress_button);
      generatorOutputMock.expects("show");
      events.showProgress();
    });
  });

  it("getMessageImage", () => {
    const errorImage = events["getMessageImage"](Severity.error);
    expect(errorImage).to.be.not.undefined;
    const infoImage = events["getMessageImage"](Severity.information);
    expect(infoImage).to.be.not.undefined;
    const warningImage = events["getMessageImage"](Severity.warning);
    expect(warningImage).to.be.not.undefined;
  });

  describe("doGeneratorDone", () => {
    const createAndClose = "Create the project and close it for future use";
    const openNewWorkspace = "Open the project in a stand-alone";
    const addToWorkspace = "Open the project in a multi-root workspace";

    it("on success, project path and workspace folder are Windows style ---> the project added to current workspace", () => {
      eventsMock.expects("doClose");
      sandbox
        .stub(vscode.workspace, "workspaceFolders")
        .value([
          { uri: { fsPath: "rootFolderPath", scheme: "file" } },
          { uri: { fsPath: "testRoot", scheme: "file" } },
        ]);
      sandbox
        .stub(vscode.workspace, "workspaceFile")
        .value("/workspace/file/path");
      windowMock
        .expects("showInformationMessage")
        .withExactArgs(
          messages.default.artifact_generated_project_add_to_workspace
        )
        .resolves();
      workspaceMock
        .expects("updateWorkspaceFolders")
        .withArgs(2, null)
        .resolves();
      return events.doGeneratorDone(
        true,
        "success message",
        addToWorkspace,
        "project",
        "testDestinationRoot"
      );
    });

    it("on success, project path is already openned in workspace ---> the project added to current workspace", () => {
      eventsMock.expects("doClose");
      sandbox
        .stub(vscode.workspace, "workspaceFolders")
        .value([
          { uri: { fsPath: "rootFolderPath", scheme: "file" } },
          { uri: { fsPath: "testDestinationRoot", scheme: "file" } },
        ]);
      sandbox
        .stub(vscode.workspace, "workspaceFile")
        .value("/workspace/file/path");
      windowMock
        .expects("showInformationMessage")
        .withExactArgs(
          messages.default.artifact_generated_project_add_to_workspace
        )
        .resolves();
      workspaceMock
        .expects("updateWorkspaceFolders")
        .withArgs(2, null)
        .resolves();
      return events.doGeneratorDone(
        true,
        "success message",
        addToWorkspace,
        "project",
        "testDestinationRoot"
      );
    });

    it("on success, project path parent folder is already openned in workspace ---> the user changed to create and close the project for later use", () => {
      eventsMock.expects("doClose");
      sandbox
        .stub(vscode.workspace, "workspaceFolders")
        .value([
          { uri: { fsPath: "rootFolderPath", scheme: "file" } },
          { uri: { fsPath: "testDestinationRoot", scheme: "file" } },
        ]);
      windowMock
        .expects("showInformationMessage")
        .withExactArgs(
          messages.default.artifact_generated_project_saved_for_future
        )
        .resolves();
      return events.doGeneratorDone(
        true,
        "success message",
        createAndClose,
        "project",
        "testDestinationRoot/projectName"
      );
    });

    it("on success, project path parent folder is already openned in workspace ---> the project openned in a stand-alone", () => {
      eventsMock.expects("doClose");
      sandbox
        .stub(vscode.workspace, "workspaceFolders")
        .value([
          { uri: { fsPath: "rootFolderPath", scheme: "file" } },
          { uri: { fsPath: "testDestinationRoot", scheme: "file" } },
        ]);
      windowMock
        .expects("showInformationMessage")
        .withExactArgs(
          messages.default.artifact_generated_project_open_in_a_new_workspace
        )
        .resolves();
      commandsMock
        .expects("executeCommand")
        .withArgs("vscode.openFolder")
        .resolves();
      return events.doGeneratorDone(
        true,
        "success message",
        openNewWorkspace,
        "project",
        "testDestinationRoot/./projectName"
      );
    });

    it("on success, no workspace is opened ---> the project openned in a new multi-root workspace", () => {
      eventsMock.expects("doClose");
      sandbox.stub(vscode.workspace, "workspaceFolders").value([]);
      sandbox.stub(vscode.workspace, "workspaceFile").value(undefined);
      windowMock
        .expects("showInformationMessage")
        .withExactArgs(
          messages.default.artifact_generated_project_add_to_workspace
        )
        .resolves();
      commandsMock
        .expects("executeCommand")
        .withArgs("vscode.openFolder")
        .resolves();
      workspaceMock.expects("updateWorkspaceFolders").withArgs(0, null);
      uriMock.expects("file").once().returns({ fsPath: "testFsPath" });
      return events.doGeneratorDone(
        true,
        "success message",
        "Open the project in a multi-root workspace",
        "project",
        "testDestinationRoot/./projectName"
      );
    });

    it("on success, targetFolder is uri and the the project openned in a new multi-root workspace", () => {
      eventsMock.expects("doClose");
      sandbox.stub(vscode.workspace, "workspaceFolders").value([]);
      sandbox.stub(vscode.workspace, "workspaceFile").value(undefined);
      windowMock
        .expects("showInformationMessage")
        .withExactArgs(
          messages.default.artifact_generated_project_add_to_workspace
        )
        .resolves();
      commandsMock
        .expects("executeCommand")
        .withArgs("vscode.openFolder")
        .resolves();
      workspaceMock.expects("updateWorkspaceFolders").withArgs(0, null);

      void events.doGeneratorDone(
        true,
        "success message",
        "Open the project in a multi-root workspace",
        "project",
        '{"uri":"abapdf://testDestinationRoot","name":"projectName"}'
      );
    });

    it("on success, targetFolderPath is uri and the the project openned in a Open the project in a stand-alone", () => {
      eventsMock.expects("doClose");
      sandbox.stub(vscode.workspace, "workspaceFolders").value([]);
      sandbox.stub(vscode.workspace, "workspaceFile").value(undefined);
      windowMock
        .expects("showInformationMessage")
        .withExactArgs(
          messages.default.artifact_generated_project_open_in_a_new_workspace
        )
        .resolves();
      commandsMock
        .expects("executeCommand")
        .withArgs("vscode.openFolder")
        .resolves();

      void events.doGeneratorDone(
        true,
        "success message",
        "Open the project in a stand-alone",
        "project",
        '{"uri":"abapdf://testDestinationRoot","name":"projectName"}'
      );
    });

    it("on success, targetFolderPath is uri and the the project openned in a Create the project and close it for future use", () => {
      eventsMock.expects("doClose");
      sandbox.stub(vscode.workspace, "workspaceFolders").value([]);
      sandbox.stub(vscode.workspace, "workspaceFile").value(undefined);
      windowMock
        .expects("showInformationMessage")
        .withExactArgs(
          messages.default.artifact_generated_project_saved_for_future
        )
        .resolves();

      void events.doGeneratorDone(
        true,
        "success message",
        "Create the project and close it for future use",
        "project",
        '{"uri":"abapdf://testDestinationRoot","name":"projectName"}'
      );
    });

    it("on success, module is created", () => {
      eventsMock.expects("doClose");
      sandbox
        .stub(vscode.workspace, "workspaceFolders")
        .value([
          { uri: { fsPath: "rootFolderPath", scheme: "file" } },
          { uri: { fsPath: "testDestinationRoot", scheme: "file" } },
        ]);
      windowMock
        .expects("showInformationMessage")
        .withExactArgs(messages.default.artifact_generated_module)
        .resolves();
      return events.doGeneratorDone(
        true,
        "success message",
        createAndClose,
        "module",
        "testDestinationRoot/projectName/../projectName"
      );
    });

    it("on success, not a module and not a project", () => {
      eventsMock.expects("doClose");
      sandbox.stub(vscode.workspace, "workspaceFolders").value([
        { uri: { fsPath: "rootFolderPath", scheme: "file" } },
        {
          uri: {
            fsPath: "testDestinationRoot/../testDestinationRoot",
            scheme: "file",
          },
        },
      ]);
      windowMock
        .expects("showInformationMessage")
        .withExactArgs(messages.default.artifact_generated_files)
        .resolves();
      return events.doGeneratorDone(
        true,
        "success message",
        createAndClose,
        "files",
        "testDestinationRoot/projectName/../projectName"
      );
    });

    it("on success with null targetFolderPath", () => {
      eventsMock.expects("doClose");
      sandbox
        .stub(vscode.workspace, "workspaceFolders")
        .value([{ uri: { fsPath: "rootFolderPath", scheme: "file" } }]);
      windowMock
        .expects("showInformationMessage")
        .withExactArgs(messages.default.artifact_generated_files)
        .resolves();
      return events.doGeneratorDone(
        true,
        "success message",
        createAndClose,
        "files",
        null
      );
    });

    it("on failure", () => {
      eventsMock.expects("doClose");
      windowMock.expects("showErrorMessage").withExactArgs("error message");
      return events.doGeneratorDone(
        false,
        "error message",
        createAndClose,
        "files"
      );
    });

    it("on success with currentProjectName - open in new workspace", () => {
      // Simulate enhanced mode setting currentProjectName
      events["currentProjectName"] = "MyTestProject";
      eventsMock.expects("doClose");
      windowMock
        .expects("showInformationMessage")
        .withExactArgs(
          "Project MyTestProject has been generated. The project will be opened in a new workspace."
        )
        .resolves();
      commandsMock.expects("executeCommand").withArgs("vscode.openFolder");
      uriMock.expects("file").once();
      return events.doGeneratorDone(
        true,
        "success message",
        openNewWorkspace,
        "project",
        "testDestinationRoot"
      );
    });

    it("on success with currentProjectName - add to workspace", () => {
      // Simulate enhanced mode setting currentProjectName
      events["currentProjectName"] = "MyTestProject";
      eventsMock.expects("doClose");
      sandbox.stub(vscode.workspace, "workspaceFolders").value([]);
      sandbox.stub(vscode.workspace, "workspaceFile").value(undefined);
      windowMock
        .expects("showInformationMessage")
        .withExactArgs(
          "Project MyTestProject has been generated. The project has been added to workspace."
        )
        .resolves();
      workspaceMock.expects("updateWorkspaceFolders").withArgs(0, null);
      commandsMock.expects("executeCommand").withArgs("vscode.openFolder");
      uriMock.expects("file").once();
      return events.doGeneratorDone(
        true,
        "success message",
        addToWorkspace,
        "project",
        "testDestinationRoot"
      );
    });

    it("on success with currentProjectName - create and close", () => {
      // Simulate enhanced mode setting currentProjectName
      events["currentProjectName"] = "MyTestProject";
      eventsMock.expects("doClose");
      windowMock
        .expects("showInformationMessage")
        .withExactArgs("Project MyTestProject has been generated.")
        .resolves();
      uriMock.expects("file").once();
      return events.doGeneratorDone(
        true,
        "success message",
        createAndClose,
        "project",
        "testDestinationRoot"
      );
    });

    it("on success with type empty string - no message shown", () => {
      eventsMock.expects("doClose");
      // When type is "", no information message should be shown
      windowMock.expects("showInformationMessage").never();
      uriMock.expects("file").once();
      return events.doGeneratorDone(
        true,
        "success message",
        createAndClose,
        "", // Empty type
        "testDestinationRoot"
      );
    });

    it("on success with type module", () => {
      eventsMock.expects("doClose");
      windowMock
        .expects("showInformationMessage")
        .withExactArgs(messages.default.artifact_generated_module)
        .resolves();
      uriMock.expects("file").once();
      return events.doGeneratorDone(
        true,
        "success message",
        createAndClose,
        "module",
        "testDestinationRoot"
      );
    });

    it("on failure - shows error message", () => {
      eventsMock.expects("doClose");
      windowMock
        .expects("showErrorMessage")
        .withExactArgs("Error occurred during generation")
        .resolves();
      return events.doGeneratorDone(
        false,
        "Error occurred during generation",
        createAndClose,
        "project",
        "testDestinationRoot"
      );
    });

    it("on success with no targetFolderPath", () => {
      eventsMock.expects("doClose");
      windowMock
        .expects("showInformationMessage")
        .withExactArgs(messages.default.artifact_generated_files)
        .resolves();
      // No targetFolderPath provided
      return events.doGeneratorDone(
        true,
        "success message",
        createAndClose,
        "files",
        undefined
      );
    });

    it("on success - enhanced mode shows Finalising message", async () => {
      // Simulate enhanced mode by setting progressReporter and flag
      const mockReporter = { report: sandbox.stub() };
      events["progressReporter"] = mockReporter;
      events["isEnhancedProgressMode"] = true;

      eventsMock.expects("doClose");
      windowMock
        .expects("showInformationMessage")
        .withExactArgs(messages.default.artifact_generated_files)
        .resolves();

      const result = events.doGeneratorDone(
        true,
        "success message",
        createAndClose,
        "files",
        undefined
      );

      // Verify "Finalising..." was reported
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(
        mockReporter.report.calledWith({
          message: messages.default.progress_finalising,
        })
      ).to.be.true;

      await result;
    });

    it("on success - cancels pending timer before showing Finalising", async () => {
      _.set(vscode, "ProgressLocation.Notification", 15);
      let progressReporter: any;

      windowMock
        .expects("withProgress")
        .callsFake((options: any, callback: any) => {
          progressReporter = {
            report: sandbox.stub(),
          };
          return callback(progressReporter);
        });

      eventsMock.expects("doClose").twice(); // Once for initial progress, once for done

      // Start with writing phase (creates a long minimum duration)
      events.doGeneratorProgress("testProject", "writing", true);
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Schedule a phase transition (creates a timer)
      events.doGeneratorProgress("testProject", "install", true);

      // Verify timer exists
      expect(events["pendingPhaseTimer"]).to.not.be.null;

      // Call doGeneratorDone - should cancel the timer
      // Since currentProjectName is set to "testProject", expect that in the message
      windowMock
        .expects("showInformationMessage")
        .withExactArgs("Project testProject has been generated.")
        .resolves();
      uriMock.expects("file").once();

      const result = events.doGeneratorDone(
        true,
        "success message",
        createAndClose,
        "project",
        "testDestinationRoot"
      );

      // Verify timer was cleared
      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(events["pendingPhaseTimer"]).to.be.null;

      await result;
    });

    it("showDoneMessage with skipResolve=false calls resolveInstallingProgress", () => {
      // Test private method directly to cover lines 339-340
      windowMock
        .expects("showInformationMessage")
        .withExactArgs(messages.default.artifact_generated_files)
        .resolves();
      // Call private method with skipResolve=false (default)
      return events["showDoneMessage"](
        true,
        "success message",
        createAndClose,
        "files",
        undefined,
        false
      );
    });
  });

  describe("getUniqueProjectName", () => {
    it("should return baseName if it does not exist in workspace", () => {
      sandbox.stub(vscode.workspace, "workspaceFolders").value([
        { name: "Project1", uri: { scheme: "file" } },
        { name: "Project2", uri: { scheme: "file" } },
      ]);
      const result = events["getUniqueProjectName"]("NewProject");
      expect(result).to.equal("NewProject");
    });

    it("should return baseName(1) if baseName already exists", () => {
      sandbox.stub(vscode.workspace, "workspaceFolders").value([
        { name: "Project1", uri: { scheme: "file" } },
        { name: "NewProject", uri: { scheme: "file" } },
      ]);
      const result = events["getUniqueProjectName"]("NewProject");
      expect(result).to.equal("NewProject(1)");
    });

    it("should return baseName with incremented counter if multiple exist", () => {
      sandbox.stub(vscode.workspace, "workspaceFolders").value([
        { name: "NewProject", uri: { scheme: "file" } },
        { name: "NewProject(1)", uri: { scheme: "file" } },
        { name: "NewProject(2)", uri: { scheme: "file" } },
      ]);
      const result = events["getUniqueProjectName"]("NewProject");
      expect(result).to.equal("NewProject(3)");
    });

    it("should handle empty workspace folders gracefully", () => {
      sandbox.stub(vscode.workspace, "workspaceFolders").value(undefined);
      const result = events["getUniqueProjectName"]("UniqueProject");
      expect(result).to.equal("UniqueProject");
    });
  });
});
