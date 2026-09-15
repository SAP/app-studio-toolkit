import { expect } from "chai";
import { SinonMock, SinonSandbox, SinonSpy, createSandbox } from "sinon";
import * as path from "path";
import { mockVscode, testVscode } from "../utils/mockVSCode";

mockVscode("src/usage-report/usage-analytics-wrapper");

import { AnalyticsWrapper } from "../../src/usage-report/usage-analytics-wrapper";
import * as swa from "@sap/swa-for-sapbas-vsx";

describe("AnalyticsWrapper scope", () => {
  let sandbox: SinonSandbox;

  before(() => {
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("report method", () => {
    let mockClient: SinonMock;

    beforeEach(() => {
      mockClient = sandbox.mock(AnalyticsWrapper["client"]);
    });
    afterEach(async () => {
      mockClient.verify();
    });

    it("report succedded, there are properties", () => {
      const properties = { source: "contextMenu" };
      mockClient.expects("report").withExactArgs("event", properties).resolves();
      AnalyticsWrapper["report"]("event", properties);
    });

    it("report succedded, no properties", () => {
      mockClient.expects("report").withExactArgs("event", {}).resolves();
      AnalyticsWrapper["report"]("event");
    });

    it("report failed", () => {
      mockClient.expects("report").withExactArgs("event", {}).rejects(new Error("error"));
      AnalyticsWrapper["report"]("event");
    });
  });

  describe("createTracker method", () => {
    let packageJson: any;

    before(() => {
      packageJson = require(path.join(__dirname, "..", "..", "..", "package.json"));
    });

    let mockClientFactory: SinonMock;
    let initTelemetrySettingsSpy: SinonSpy;

    beforeEach(() => {
      initTelemetrySettingsSpy = sandbox.stub(swa, "initTelemetrySettings");
      mockClientFactory = sandbox.mock(swa.BASClientFactory);
    });

    afterEach(() => {
      mockClientFactory.verify();
    });

    it("createTracker - tracking not allowed", () => {
      mockClientFactory.expects("getBASTelemetryClient").never();
      AnalyticsWrapper.createTracker(testVscode.ExtensionContext);
      expect(initTelemetrySettingsSpy.notCalled).to.be.true;
    });

    it("createTracker - allowed, succedded", () => {
      sandbox.stub(process, "env").value({ LANDSCAPE_ENVIRONMENT: "true" });
      sandbox.stub(testVscode.ExtensionContext, "extensionPath").value(path.join("..", "..", ".."));
      mockClientFactory.expects("getBASTelemetryClient").returns({});
      AnalyticsWrapper.createTracker(testVscode.ExtensionContext);
      expect(
        initTelemetrySettingsSpy.calledOnceWithExactly("SAPSE.vscode-tasks-explorer-tasks-panel", packageJson.version),
      ).to.be.true;
    });

    it("createTracker - exception thrown (package.json path wrong)", () => {
      sandbox.stub(process, "env").value({ LANDSCAPE_ENVIRONMENT: "true" });
      sandbox.stub(testVscode.ExtensionContext, "extensionPath").value(path.join("..", ".."));
      mockClientFactory.expects("getBASTelemetryClient").never();
      AnalyticsWrapper.createTracker(testVscode.ExtensionContext);
    });
  });

  describe("specific report methods", () => {
    let mockReport: SinonMock;

    beforeEach(() => {
      mockReport = sandbox.mock(AnalyticsWrapper);
    });

    afterEach(() => {
      mockReport.verify();
    });

    it("reportTaskCreate - from the context menu", () => {
      mockReport.expects("report").withExactArgs("task create initiated", { source: "contextMenu" }).resolves();
      AnalyticsWrapper.reportTaskCreate({ name: "test" });
    });

    it("reportTaskCreate - from the command", () => {
      mockReport.expects("report").withExactArgs("task create initiated", { source: "command" }).resolves();
      AnalyticsWrapper.reportTaskCreate();
    });

    it("reportTaskCreateSelected", () => {
      const properties = { taskType: "taskType", type: "type", name: "name" };
      mockReport
        .expects("report")
        .withExactArgs("task create selected", { intent: properties.taskType, type: properties.type })
        .resolves();
      AnalyticsWrapper.reportTaskCreateSelected(properties);
    });

    it("reportTaskCreateSelected - task type is undefined", () => {
      const properties = { type: "type", name: "name" };
      mockReport
        .expects("report")
        .withExactArgs("task create selected", { intent: "", type: properties.type })
        .resolves();
      AnalyticsWrapper.reportTaskCreateSelected(properties);
    });

    it("reportTaskCreateFinished", () => {
      const properties = { taskType: "taskType", type: "type", name: "name" };
      mockReport
        .expects("report")
        .withExactArgs("task create finished", { intent: properties.taskType, type: properties.type })
        .resolves();
      AnalyticsWrapper.reportTaskCreateFinished(properties);
    });

    it("reportTaskCreateFinished - task type is undefined", () => {
      const properties = { type: "type", name: "name" };
      mockReport
        .expects("report")
        .withExactArgs("task create finished", { intent: "", type: properties.type })
        .resolves();
      AnalyticsWrapper.reportTaskCreateFinished(properties);
    });

    it("reportTaskSave", () => {
      const properties = { __intent: "intent", __extensionName: "extName", type: "type", name: "name" };
      mockReport
        .expects("report")
        .withExactArgs("task save", {
          intent: properties.__intent,
          extensionName: properties.__extensionName,
          type: properties.type,
        })
        .rejects(new Error("error"));
      AnalyticsWrapper.reportTaskSave(properties);
    });

    it("reportTaskExecuteEditor", () => {
      const properties = { __intent: "intent", __extensionName: "extName", type: "type", name: "name" };
      mockReport
        .expects("report")
        .withExactArgs("task execute", {
          source: "editor",
          intent: properties.__intent,
          extensionName: properties.__extensionName,
          type: properties.type,
        })
        .resolves();
      AnalyticsWrapper.reportTaskExecuteEditor(properties);
    });

    it("reportTaskExecuteTree", () => {
      const properties = { __intent: "intent", __extensionName: "extName", type: "type", name: "name" };
      mockReport
        .expects("report")
        .withExactArgs("task execute", {
          source: "tree",
          intent: properties.__intent,
          extensionName: properties.__extensionName,
          type: properties.type,
        })
        .resolves();
      AnalyticsWrapper.reportTaskExecuteTree(properties);
    });

    it("reportTaskDelete", () => {
      const properties = { __intent: "intent", __extensionName: "extName", type: "type", name: "name" };
      mockReport
        .expects("report")
        .withExactArgs("task delete", {
          intent: properties.__intent,
          extensionName: properties.__extensionName,
          type: properties.type,
        })
        .resolves();
      AnalyticsWrapper.reportTaskDelete(properties);
    });

    it("reportTaskDuplicate", () => {
      const properties = { __intent: "intent", __extensionName: "extName", type: "type", name: "name" };
      mockReport
        .expects("report")
        .withExactArgs("task duplicate", {
          intent: properties.__intent,
          extensionName: properties.__extensionName,
          type: properties.type,
        })
        .resolves();
      AnalyticsWrapper.reportTaskDuplicate(properties);
    });

    it("reportTaskExecuteTerminate", () => {
      const properties = { __intent: "intent", __extensionName: "extName", type: "type", name: "name" };
      mockReport
        .expects("report")
        .withExactArgs("task terminate", {
          intent: properties.__intent,
          extensionName: properties.__extensionName,
          type: properties.type,
        })
        .resolves();
      AnalyticsWrapper.reportTaskExecuteTerminate(properties);
    });

    it("reportTaskReveal", () => {
      const properties = { __intent: "intent", __extensionName: "extName", type: "type", name: "name" };
      mockReport
        .expects("report")
        .withExactArgs("task show in file", {
          intent: properties.__intent,
          extensionName: properties.__extensionName,
          type: properties.type,
        })
        .resolves();
      AnalyticsWrapper.reportTaskReveal(properties);
    });

    it("reportViewVisibility", () => {
      const properties = { __intent: "intent", __extensionName: "extName", type: "type", visible: false };
      mockReport.expects("report").withExactArgs("view visibility", { visible: properties.visible }).resolves();
      AnalyticsWrapper.reportViewVisibility(properties);
    });
  });
});
