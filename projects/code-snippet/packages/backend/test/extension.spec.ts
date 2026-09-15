import { expect } from "chai";
import * as sinon from "sinon";
import * as _ from "lodash";
import { mockVscode } from "./mockUtil";

const oRegisteredCommands = {};
const testVscode = {
  workspace: {
    getConfiguration: () => true,
  },
  commands: {
    registerCommand: (id: string, cmd: any) => {
      _.set(oRegisteredCommands, id, cmd);
      return Promise.resolve(oRegisteredCommands);
    },
    executeCommand: () => Promise.resolve(),
  },
  window: {
    registerWebviewPanelSerializer: () => true,
  },
};
mockVscode(testVscode, "src/extension.ts");
import * as extension from "../src/extension";
import * as loggerWrapper from "../src/logger/logger-wrapper";
import { AnalyticsWrapper } from "../src/usage-report/usage-analytics-wrapper";

describe("extension unit test", () => {
  let sandbox: any;
  let commandsMock: any;
  let windowMock: any;
  let workspaceMock: any;
  let loggerWrapperMock: any;
  let trackerWrapperMock: any;
  const testContext: any = {
    subscriptions: [],
    extensionPath: "testExtensionpath",
    globalState: { get: () => true, update: () => true },
  };

  before(() => {
    sandbox = sinon.createSandbox();
  });

  after(() => {
    sandbox.restore();
  });

  beforeEach(() => {
    loggerWrapperMock = sandbox.mock(loggerWrapper);
    commandsMock = sandbox.mock(testVscode.commands);
    windowMock = sandbox.mock(testVscode.window);
    trackerWrapperMock = sandbox.mock(AnalyticsWrapper);
    workspaceMock = sandbox.mock(testVscode.workspace);
  });

  afterEach(() => {
    loggerWrapperMock.verify();
    commandsMock.verify();
    windowMock.verify();
    trackerWrapperMock.verify();
    workspaceMock.verify();
  });

  describe("activate", () => {
    it("commands registration", () => {
      loggerWrapperMock.expects(
        "createExtensionLoggerAndSubscribeToLogSettingsChanges"
      );
      loggerWrapperMock.expects("getLogger");
      loggerWrapperMock.expects("getClassLogger").twice();
      trackerWrapperMock.expects("createTracker");
      extension.activate(testContext);
      expect(_.size(_.keys(oRegisteredCommands))).to.be.equal(2);
      expect(_.get(oRegisteredCommands, "loadCodeSnippet")).to.be.not.undefined;
      expect(_.get(oRegisteredCommands, "codeSnippet.toggleOutput")).to.be.not
        .undefined;
    });

    it("logger failure on extenion activation", () => {
      const consoleMock = sandbox.mock(console);
      loggerWrapperMock
        .expects("createExtensionLoggerAndSubscribeToLogSettingsChanges")
        .throws(new Error("activation error"));
      consoleMock
        .expects("error")
        .withExactArgs(
          "Extension activation failed due to Logger configuration failure:",
          "activation error"
        );
      extension.activate(null);
    });
  });

  it("deactivate", () => {
    extension.activate(testContext);
    extension.deactivate();
  });
});
