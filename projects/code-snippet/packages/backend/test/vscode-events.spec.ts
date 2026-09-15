import { expect } from "chai";
import * as sinon from "sinon";
import * as _ from "lodash";
import * as vscode from "vscode";
import { VSCodeEvents as VSCodeEvents } from "../src/vscode-events";

describe("vscode-events unit test", () => {
  let events: VSCodeEvents;
  let sandbox: any;
  let windowMock: any;
  let commandsMock: any;
  let workspaceMock: any;
  let eventsMock: any;

  before(() => {
    sandbox = sinon.createSandbox();
    _.set(vscode, "ProgressLocation.Notification", 15);
    _.set(vscode, "Uri.file", (path: string) => {
      return {
        fsPath: path,
      };
    });
    _.set(vscode, "window.showInformationMessage", () => {
      return Promise.resolve("");
    });
    _.set(vscode, "window.showErrorMessage", () => {
      return Promise.resolve("");
    });
    _.set(vscode, "workspace.workspaceFolders", []);
    _.set(vscode, "workspace.updateWorkspaceFolders", (): any => undefined);
    _.set(vscode, "workspace.applyEdit", (): any => undefined);
    _.set(vscode, "commands.executeCommand", (): any => undefined);
    _.set(vscode, "WorkspaceEdit", function () {
      return {};
    });
  });

  after(() => {
    sandbox.restore();
  });

  beforeEach(() => {
    events = new VSCodeEvents(undefined);
    windowMock = sandbox.mock(vscode.window);
    commandsMock = sandbox.mock(vscode.commands);
    workspaceMock = sandbox.mock(vscode.workspace);
    eventsMock = sandbox.mock(events);
  });

  afterEach(() => {
    windowMock.verify();
    eventsMock.verify();
    commandsMock.verify();
    workspaceMock.verify();
  });

  describe("doApply", () => {
    it("applyEdit is called", () => {
      const we = new vscode.WorkspaceEdit();
      workspaceMock.expects("applyEdit").withExactArgs(we);
      events.doApply(we);
    });
  });

  describe("doSnippeDone", () => {
    it("on success", () => {
      eventsMock.expects("doClose");
      windowMock
        .expects("showInformationMessage")
        .withExactArgs("success message")
        .resolves();
      return events.doSnippeDone(
        true,
        "success message",
        "testTargetFolderPath"
      );
    });

    it("on failure", () => {
      eventsMock.expects("doClose");
      windowMock.expects("showErrorMessage").withExactArgs("error message");
      return events.doSnippeDone(false, "error message");
    });

    it("verify showDoneMessage called", () => {
      const showDoneMessageSpy = sandbox.spy(events, "showDoneMessage");
      events.doSnippeDone(true, "success message", "testTargetFolderPath");
      expect(showDoneMessageSpy.called).to.be.true;
    });

    it("webviewPanel exists ---> webviewPanel is disposed", () => {
      const webViewPanel: any = { dispose: () => true };
      events = new VSCodeEvents(webViewPanel);
      const webViewPanelSpy = sandbox.spy(webViewPanel, "dispose");
      events.doSnippeDone(true, "success message", "testTargetFolderPath");
      expect(webViewPanelSpy.called).to.be.true;
    });
  });

  it("executeCommand", () => {
    const commandId = "vscode.open";
    const commandArgs = [vscode.Uri.file("https://en.wikipedia.org")];
    commandsMock
      .expects("executeCommand")
      .withExactArgs(commandId, commandArgs)
      .resolves();
    events.executeCommand(commandId, commandArgs);
  });
});
