import { vscode } from "./mockUtil.js";
import { expect } from "chai";
import { createSandbox, SinonSandbox, SinonMock } from "sinon";
import lodash from "lodash";
import {
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
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const fs = require("fs");

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
    loggerWrapper.internalApi.setLogger(testLogger);
  });

  after(() => {
    loggerWrapper.internalApi.resetLogger();
  });

  beforeEach(() => {
    sandbox = createSandbox();
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

    it("setHeaderTitle via AppWizard", () => {
      const appWizard = events.getAppWizard();
      rpcMock
        .expects("invoke")
        .withExactArgs("setHeaderTitle", ["Test Title", "Test Info"]);
      appWizard.setHeaderTitle("Test Title", "Test Info");
    });

    it("setBanner via AppWizard", () => {
      const appWizard = events.getAppWizard();
      const bannerProps: IBannerProps = {
        text: "Test Banner",
        ariaLabel: "Test Label",
      };
      rpcMock.expects("invoke").withExactArgs("setBanner", [bannerProps]);
      appWizard.setBanner(bannerProps);
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

  describe("doGeneratorProgress", () => {
    it("writing phase - initializes notification with project name", () => {
      const projectName = "testProject";
      lodash.set(vscode, "ProgressLocation.Notification", 15);
      eventsMock.expects("doClose");
      // Stub getConfiguration to enable progress notification
      sandbox.stub(vscode.workspace, "getConfiguration").returns({
        get: sandbox
          .stub()
          .withArgs("ApplicationWizard.showGeneratorProgress", true)
          .returns(true),
      } as any);
      windowMock
        .expects("withProgress")
        .withArgs({
          location: 15,
          title: "Generating testProject",
          cancellable: false,
        })
        .resolves();
      events.doGeneratorProgress(projectName, "writing", true);
    });

    it("writing phase - uses default title when no project name", () => {
      lodash.set(vscode, "ProgressLocation.Notification", 15);
      eventsMock.expects("doClose");
      // Stub getConfiguration to enable progress notification
      sandbox.stub(vscode.workspace, "getConfiguration").returns({
        get: sandbox
          .stub()
          .withArgs("ApplicationWizard.showGeneratorProgress", true)
          .returns(true),
      } as any);
      windowMock
        .expects("withProgress")
        .withArgs({
          location: 15,
          title: "Application Generator",
          cancellable: false,
        })
        .resolves();
      events.doGeneratorProgress(undefined, "writing", true);
    });

    it("install phase - updates progress message", () => {
      // Stub getConfiguration to enable progress notification
      sandbox.stub(vscode.workspace, "getConfiguration").returns({
        get: sandbox
          .stub()
          .withArgs("ApplicationWizard.showGeneratorProgress", true)
          .returns(true),
      } as any);
      const mockProgressReporter = {
        report: sandbox.stub(),
      };
      events["progressReporter"] = mockProgressReporter;

      events.doGeneratorProgress("testProject", "install", true);

      // Should be called with the install message after delay
      expect(mockProgressReporter.report.called).to.be.true;
      expect(mockProgressReporter.report.firstCall.args[0]).to.deep.equal({
        message: messages.default.progress_installing,
      });

      events["progressReporter"] = null;
    });

    it("end phase - updates progress message", () => {
      // Stub getConfiguration to enable progress notification
      sandbox.stub(vscode.workspace, "getConfiguration").returns({
        get: sandbox
          .stub()
          .withArgs("ApplicationWizard.showGeneratorProgress", true)
          .returns(true),
      } as any);
      const mockProgressReporter = {
        report: sandbox.stub(),
      };
      events["progressReporter"] = mockProgressReporter;

      events.doGeneratorProgress("testProject", "end", true);

      // Should be called with the end message
      expect(mockProgressReporter.report.called).to.be.true;
      expect(mockProgressReporter.report.firstCall.args[0]).to.deep.equal({
        message: messages.default.progress_finalising,
      });

      events["progressReporter"] = null;
    });

    it("install/end phases - does nothing when progressReporter is null", () => {
      // Stub getConfiguration to enable progress notification
      sandbox.stub(vscode.workspace, "getConfiguration").returns({
        get: sandbox
          .stub()
          .withArgs("ApplicationWizard.showGeneratorProgress", true)
          .returns(true),
      } as any);
      events["progressReporter"] = null;

      // Should not throw when progressReporter is null
      events.doGeneratorProgress("testProject", "install", true);
      events.doGeneratorProgress("testProject", "end", true);
    });

    it("does nothing when setting is disabled", () => {
      // Stub getConfiguration to return false
      sandbox.stub(vscode.workspace, "getConfiguration").returns({
        get: sandbox
          .stub()
          .withArgs("ApplicationWizard.showGeneratorProgress", true)
          .returns(false),
      } as any);

      // Should not call doClose or showInstallMessage
      eventsMock.expects("doClose").never();
      windowMock.expects("withProgress").never();

      events.doGeneratorProgress("testProject", "writing", true);
      events.doGeneratorProgress("testProject", "install", true);
      events.doGeneratorProgress("testProject", "end", true);
    });

    it("does nothing when showProgress parameter is false", () => {
      // Even if setting is enabled, showProgress=false should skip everything
      sandbox.stub(vscode.workspace, "getConfiguration").returns({
        get: sandbox
          .stub()
          .withArgs("ApplicationWizard.showGeneratorProgress", true)
          .returns(true),
      } as any);

      // Should not call doClose or showInstallMessage
      eventsMock.expects("doClose").never();
      windowMock.expects("withProgress").never();

      events.doGeneratorProgress("testProject", "writing", false);
      events.doGeneratorProgress("testProject", "install", false);
      events.doGeneratorProgress("testProject", "end", false);
    });

    it("writing phase with existing progressReporter - does not call doClose", () => {
      // Stub getConfiguration to enable progress notification
      sandbox.stub(vscode.workspace, "getConfiguration").returns({
        get: sandbox
          .stub()
          .withArgs("ApplicationWizard.showGeneratorProgress", true)
          .returns(true),
      } as any);

      const mockProgressReporter = {
        report: sandbox.stub(),
      };
      events["progressReporter"] = mockProgressReporter;

      // Should not call doClose when progressReporter already exists
      eventsMock.expects("doClose").never();

      events.doGeneratorProgress("testProject", "writing", true);

      // Should update the progress reporter
      expect(mockProgressReporter.report.called).to.be.true;
      expect(mockProgressReporter.report.firstCall.args[0]).to.deep.equal({
        message: messages.default.progress_writing_files,
      });

      events["progressReporter"] = null;
    });

    it("phases fire in correct order without race condition", () => {
      // Stub getConfiguration to enable progress notification
      sandbox.stub(vscode.workspace, "getConfiguration").returns({
        get: sandbox
          .stub()
          .withArgs("ApplicationWizard.showGeneratorProgress", true)
          .returns(true),
      } as any);

      // Stub WorkspaceFile methods
      sandbox
        .stub(WorkspaceFile, "createWsWithPath")
        .returns(vscode.Uri.file("mocked"));
      sandbox
        .stub(WorkspaceFile, "createWsWithUri")
        .returns(vscode.Uri.file("mocked"));

      const reportCalls: string[] = [];
      const mockProgressReporter = {
        report: sandbox.stub().callsFake((args: any) => {
          reportCalls.push(args.message);
        }),
      };

      // Stub withProgress to track all report calls
      windowMock
        .expects("withProgress")
        .callsFake((_options: any, callback: any) => {
          callback(mockProgressReporter);
          return Promise.resolve();
        });

      // Fire writing phase (creates progress notification)
      events.doGeneratorProgress("testProject", "writing", true);

      // Simulate rapid install and end phases (as yeoman emits them)
      events["progressReporter"] = mockProgressReporter;
      events.doGeneratorProgress("testProject", "install", true);
      events.doGeneratorProgress("testProject", "end", true);

      // Verify messages appear in correct order
      expect(reportCalls).to.have.lengthOf(3);
      expect(reportCalls[0]).to.equal(messages.default.progress_writing_files);
      expect(reportCalls[1]).to.equal(messages.default.progress_installing);
      expect(reportCalls[2]).to.equal(messages.default.progress_finalising);

      events["progressReporter"] = null;
    });

    it("resolves progress notification properly when generation completes", async () => {
      // Stub getConfiguration
      sandbox.stub(vscode.workspace, "getConfiguration").returns({
        get: sandbox
          .stub()
          .withArgs("ApplicationWizard.showGeneratorProgress", true)
          .returns(true),
      } as any);

      // Stub WorkspaceFile methods
      sandbox
        .stub(WorkspaceFile, "createWsWithPath")
        .returns(vscode.Uri.file("mocked"));

      windowMock
        .expects("withProgress")
        .callsFake((_options: any, callback: any) => {
          return callback({
            report: sandbox.stub(),
          });
        });

      // Start progress notification
      events.doGeneratorProgress("testProject", "writing", true);

      // Verify resolveFunc was set
      expect(events["resolveFunc"]).to.not.be.undefined;

      // Call resolveInstallingProgress (simulating doGeneratorDone)
      events["resolveInstallingProgress"]();

      // Wait a tick for the promise to resolve
      await new Promise((resolve) => setTimeout(resolve, 10));

      // progressReporter should be cleaned up after resolution
      expect(events["progressReporter"]).to.be.null;
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
      // Stub WorkspaceFile.createWsWithPath to prevent filesystem writes in CI
      sandbox
        .stub(WorkspaceFile, "createWsWithPath")
        .returns(vscode.Uri.file("mocked"));
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

      // Stub WorkspaceFile.createWsWithUri to prevent filesystem writes in CI
      sandbox
        .stub(WorkspaceFile, "createWsWithUri")
        .returns(vscode.Uri.file("mocked"));

      return events.doGeneratorDone(
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

      // Stub WorkspaceFile.createWsWithUri to prevent filesystem writes in CI
      sandbox
        .stub(WorkspaceFile, "createWsWithUri")
        .returns(vscode.Uri.file("mocked"));

      return events.doGeneratorDone(
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

      // Stub WorkspaceFile.createWsWithUri to prevent filesystem writes in CI
      sandbox
        .stub(WorkspaceFile, "createWsWithUri")
        .returns(vscode.Uri.file("mocked"));

      return events.doGeneratorDone(
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

    it("shows finalising message when progressReporter is active", async () => {
      // Set up a mock progress reporter
      const mockProgressReporter = {
        report: sandbox.stub(),
      };
      events["progressReporter"] = mockProgressReporter;

      eventsMock.expects("doClose");
      windowMock
        .expects("showInformationMessage")
        .withExactArgs(messages.default.artifact_generated_files)
        .resolves();

      await events.doGeneratorDone(
        true,
        "success message",
        createAndClose,
        "files",
        null
      );

      // Verify progressReporter.report was called with finalising message
      expect(mockProgressReporter.report.called).to.be.true;
      expect(mockProgressReporter.report.firstCall.args[0]).to.deep.equal({
        message: messages.default.progress_finalising,
      });

      events["progressReporter"] = null;
    });

    describe("with project name in notification", () => {
      beforeEach(() => {
        // Set currentProjectName by calling doGeneratorInstall
        events["currentProjectName"] = "myTestProject";
      });

      afterEach(() => {
        events["currentProjectName"] = undefined;
      });

      it("shows project name in success message for add to workspace", () => {
        eventsMock.expects("doClose");
        sandbox.stub(vscode.workspace, "workspaceFolders").value([]);
        sandbox.stub(vscode.workspace, "workspaceFile").value(undefined);
        // Stub WorkspaceFile.createWsWithPath to prevent filesystem writes in CI
        sandbox
          .stub(WorkspaceFile, "createWsWithPath")
          .returns(vscode.Uri.file("mocked"));
        windowMock
          .expects("showInformationMessage")
          .withExactArgs(
            "Project myTestProject has been generated. The project has been added to workspace."
          )
          .resolves();
        commandsMock
          .expects("executeCommand")
          .withArgs("vscode.openFolder")
          .resolves();
        workspaceMock.expects("updateWorkspaceFolders").withArgs(0, null);
        return events.doGeneratorDone(
          true,
          "success message",
          addToWorkspace,
          "project",
          "testDestinationRoot"
        );
      });

      it("shows project name in success message for open in new workspace", () => {
        eventsMock.expects("doClose");
        sandbox.stub(vscode.workspace, "workspaceFolders").value([]);
        windowMock
          .expects("showInformationMessage")
          .withExactArgs(
            "Project myTestProject has been generated. The project will be opened in a new workspace."
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
          "testDestinationRoot"
        );
      });

      it("shows project name in success message for save for future use", () => {
        eventsMock.expects("doClose");
        sandbox.stub(vscode.workspace, "workspaceFolders").value([]);
        windowMock
          .expects("showInformationMessage")
          .withExactArgs("Project myTestProject has been generated.")
          .resolves();
        return events.doGeneratorDone(
          true,
          "success message",
          createAndClose,
          "project",
          "testDestinationRoot"
        );
      });
    });

    it("sets GENERATOR_COMPLETED flag before disposal", async () => {
      // Setup: verify flag is set before doClose is called
      let flagSetBeforeClose = false;

      eventsMock.expects("doClose").callsFake(() => {
        // Check if flag was already set when doClose is called
        const flagValue = (events["webviewPanel"] as any)?.[
          Constants.GENERATOR_COMPLETED
        ];
        flagSetBeforeClose = flagValue === true;
      });

      windowMock
        .expects("showInformationMessage")
        .withExactArgs(messages.default.artifact_generated_files)
        .resolves();

      await events.doGeneratorDone(
        true,
        "success message",
        createAndClose,
        "files",
        null
      );

      // Verify flag was set before doClose was called
      expect(flagSetBeforeClose).to.be.true;
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

  describe("edge cases for coverage", () => {
    it("showDoneMessage with skipResolve=false should call resolveInstallingProgress", async () => {
      windowMock
        .expects("showInformationMessage")
        .withExactArgs(messages.default.artifact_generated_files)
        .resolves();

      // Call showDoneMessage directly with skipResolve=false (default)
      await events["showDoneMessage"](true, "success", "", "files");
    });

    it("getSuccessInfoMessage with empty type returns empty string", () => {
      const result = events["getSuccessInfoMessage"]("", "");
      expect(result).to.equal("");
    });
  });
});
