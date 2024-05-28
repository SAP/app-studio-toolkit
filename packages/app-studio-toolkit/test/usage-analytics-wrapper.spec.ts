import chai from "chai";
import sinon from "sinon";
const { expect } = chai;

import {
  AnalyticsWrapper,
  BASClientFactory,
  BASTelemetryClient,
} from "../src/usage-report/usage-analytics-wrapper";
import * as logger from "../src/logger/logger";

describe("AnalyticsWrapper", () => {
  let sandbox: sinon.SinonSandbox;
  let getBASTelemetryClientStub: any;
  let mockClient: any;
  let getLoggerStub: any;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    mockClient = sandbox.createStubInstance(BASTelemetryClient);
    mockClient.report = sandbox.stub();
    getBASTelemetryClientStub = sandbox.stub(
      BASClientFactory,
      "getBASTelemetryClient"
    );
    getBASTelemetryClientStub.returns(mockClient);

    getLoggerStub = sandbox.stub(logger, "getLogger").returns({
      info: sandbox.stub(),
      error: sandbox.stub(),
      changeLevel: sandbox.stub(),
      changeSourceLocationTracking: sandbox.stub(),
      fatal: sandbox.stub(),
      warn: sandbox.stub(),
      debug: sandbox.stub(),
      trace: sandbox.stub(),
      getChildLogger: sandbox.stub(),
    });
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("getTracker", () => {
    it("should return a BASTelemetryClient instance", () => {
      const tracker = AnalyticsWrapper.getTracker();
      expect(tracker).to.be.an.instanceOf(BASTelemetryClient);
    });
  });

  describe("createTracker", () => {
    it("should create a tracker", () => {
      const extensionPath = ".";
      AnalyticsWrapper.createTracker(extensionPath);
      expect(
        getLoggerStub().info.calledOnceWith(
          `SAP Web Analytics tracker was created for SAPOSS.app-studio-toolkit`
        )
      ).to.be.true;
    });

    it("should handle errors while creating a tracker", () => {
      const extensionPath = "/wrong/path/to/extension";
      AnalyticsWrapper.createTracker(extensionPath);
      expect(getLoggerStub().error.calledOnce).to.be.true;
    });
  });

  describe("traceProjectTypesStatus", () => {
    it("LANDSCAPE_ENVIRONMENT does not exist, should not report", () => {
      delete process.env.LANDSCAPE_ENVIRONMENT;

      const devSpacePackName = "devSpacePackName";
      const projects = {
        "com.sap.cap": 2,
      };

      AnalyticsWrapper.traceProjectTypesStatus(devSpacePackName, projects);
      expect(mockClient.report.callCount).to.equal(0);
      expect(getLoggerStub().trace.callCount).to.equal(0);
    });

    it("should report project types status correctly", () => {
      process.env.LANDSCAPE_ENVIRONMENT = "true";

      const devSpacePackName = "devSpacePackName";
      const projects = {
        "com.sap.cap": 2,
        "com.sap.ui": 1,
        "com.sap.mdk": 3,
        "com.sap.fe": 1,
        "com.sap.hana": 1,
        "com.sap.lcap": 2,
        "bas.empty": 1,
      };

      AnalyticsWrapper.traceProjectTypesStatus(devSpacePackName, projects);

      expect(mockClient.report.callCount).to.equal(7);
      expect(
        mockClient.report.calledWith(
          "Project Types Status",
          { projectType: "CAP", devSpacePackName },
          { projectTypeQuantity: 2 }
        )
      ).to.be.true;
      expect(
        mockClient.report.calledWith(
          "Project Types Status",
          { projectType: "UI5", devSpacePackName },
          { projectTypeQuantity: 1 }
        )
      ).to.be.true;
      expect(
        mockClient.report.calledWith(
          "Project Types Status",
          { projectType: "MDK", devSpacePackName },
          { projectTypeQuantity: 3 }
        )
      ).to.be.true;
      expect(
        mockClient.report.calledWith(
          "Project Types Status",
          { projectType: "FE", devSpacePackName },
          { projectTypeQuantity: 1 }
        )
      ).to.be.true;
      expect(
        mockClient.report.calledWith(
          "Project Types Status",
          { projectType: "HANA", devSpacePackName },
          { projectTypeQuantity: 1 }
        )
      ).to.be.true;
      expect(
        mockClient.report.calledWith(
          "Project Types Status",
          { projectType: "LCAP", devSpacePackName },
          { projectTypeQuantity: 2 }
        )
      ).to.be.true;
      expect(
        mockClient.report.calledWith(
          "Project Types Status",
          { projectType: "BASEmpty", devSpacePackName },
          { projectTypeQuantity: 1 }
        )
      ).to.be.true;

      expect(getLoggerStub().trace.callCount).to.equal(7);
      expect(
        getLoggerStub().trace.calledWith(
          "SAP Web Analytics tracker was called",
          { eventName: "Project Types Status" }
        )
      ).to.be.true;
    });

    it("report throw error", () => {
      const err = new Error("report error");
      mockClient.report.throws(err);

      const devSpacePackName = "devSpacePackName";
      const projects = {
        "com.sap.cap": 2,
      };

      AnalyticsWrapper.traceProjectTypesStatus(devSpacePackName, projects);
      expect(getLoggerStub().error.calledOnceWith(err)).to.be.true;
    });
  });
});
