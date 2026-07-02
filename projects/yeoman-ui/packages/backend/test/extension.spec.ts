import { createSandbox, SinonSandbox, SinonMock } from "sinon";
import * as extension from "../src/extension";
import { ExtCommands } from "../src/extCommands";
import { internalApi as loggerTestApi } from "../src/logger/logger-wrapper";
import { AnalyticsWrapper } from "../src/usage-report/usage-analytics-wrapper";
import { vscode } from "./mockUtil";

describe("extension unit test", () => {
  let sandbox: SinonSandbox;
  let extCommandsMock: SinonMock;
  let loggerWrapperStub: any;
  let trackerWrapperMock: SinonMock;
  let windowMock: SinonMock;
  const testContext: any = {
    subscriptions: [],
    extensionPath: "testExtensionpath",
  };

  before(() => {
    sandbox = createSandbox();
  });

  after(() => {
    sandbox.restore();
  });

  beforeEach(() => {
    const origFn =
      loggerTestApi.createExtensionLoggerAndSubscribeToLogSettingsChanges;
    loggerTestApi.createExtensionLoggerAndSubscribeToLogSettingsChanges =
      () => {};
    loggerWrapperStub = {
      restore: () => {
        loggerTestApi.createExtensionLoggerAndSubscribeToLogSettingsChanges =
          origFn;
      },
      throws: (err: Error) => {
        loggerTestApi.createExtensionLoggerAndSubscribeToLogSettingsChanges =
          () => {
            throw err;
          };
      },
    };
    trackerWrapperMock = sandbox.mock(AnalyticsWrapper);
    extCommandsMock = sandbox.mock(ExtCommands);
    windowMock = sandbox.mock(vscode.window);
  });

  afterEach(() => {
    loggerWrapperStub.restore();
    trackerWrapperMock.verify();
    extCommandsMock.verify();
    windowMock.verify();
  });

  describe("activate", () => {
    it("commands registration", async () => {
      trackerWrapperMock.expects("createTracker");
      windowMock.expects("registerWebviewPanelSerializer").withArgs("yeomanui");
      windowMock
        .expects("registerWebviewPanelSerializer")
        .withArgs("exploreGens");

      await extension.activate(testContext);
    });

    it("logger failure on extension activation", async () => {
      const consoleMock = sandbox.mock(console);
      loggerWrapperStub.throws(new Error("activation error"));
      consoleMock
        .expects("error")
        .withExactArgs("Extension activation failed.", "activation error");
      await extension.activate(null);
      consoleMock.verify();
      consoleMock.restore();
    });
  });

  it("deactivate", () => {
    extension.deactivate();
  });
});
