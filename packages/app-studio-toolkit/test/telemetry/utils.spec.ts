import * as sinon from "sinon";
import { expect } from "chai";
import * as utils from "../../src/telemetry/utils";
import { ExtensionRunMode } from "../../src/telemetry/constants";
import { devspace } from "@sap/bas-sdk";
import proxyquire from "proxyquire";
import * as basUtils from "../../src/utils/bas-utils";

describe("Telemetry Utility Functions", () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("getProcessEnv", () => {
    it("should return the environment variable value if it exists", () => {
      process.env.TEST_VAR = "testValue";
      expect(utils.getProcessEnv("TEST_VAR")).to.equal("testValue");
    });

    it("should warn and return an empty string if the environment variable does not exist", () => {
      const warnStub = sandbox.stub(console, "warn");
      const result = utils.getProcessEnv("NON_EXISTENT_VAR");
      expect(
        warnStub.calledWith(
          "Environment variable NON_EXISTENT_VAR does not exist."
        )
      ).to.be.true;
      expect(result).to.equal("");
    });
  });

  describe("isSAPUser", () => {
    it("should return true if the user is an SAP user", () => {
      process.env.USER_NAME = "user@sap.com";
      expect(utils.isSAPUser()).to.equal("true");
    });

    it("should return false if the user is not an SAP user", () => {
      process.env.USER_NAME = "user@example.com";
      expect(utils.isSAPUser()).to.equal("false");
    });

    it("should return an empty string if the user name is not defined", () => {
      delete process.env.USER_NAME;
      expect(utils.isSAPUser()).to.equal("");
    });
  });

  describe("getHashedUser", () => {
    let sandbox: sinon.SinonSandbox;
    let utils: any;
    let mockVscode: any;

    beforeEach(() => {
      sandbox = sinon.createSandbox();

      mockVscode = {
        env: {
          machineId: "test-machine-id",
        },
      };

      utils = proxyquire.noCallThru().load("../../src/telemetry/utils", {
        vscode: mockVscode,
      });
    });

    afterEach(() => {
      sandbox.restore();
    });

    it("should return a consistent hash for the same user", () => {
      process.env.USER_NAME = "user@sap.com";
      const hashedResult =
        "015f94386e6b00a0cb12992d62c0ca452a9f6f962b2f6d3d7b6d7f3ccc824533";
      expect(utils.getHashedUser()).to.equal(hashedResult);
      expect(utils.getHashedUser()).to.equal(hashedResult);
    });

    it("should return machineId when USER_NAME is not set", () => {
      delete process.env.USER_NAME;
      expect(utils.getHashedUser()).to.equal("test-machine-id");
    });

    it("should return an empty string when machineId is undefined", () => {
      delete process.env.USER_NAME;
      mockVscode.env.machineId = undefined;
      utils = proxyquire.noCallThru().load("../../src/telemetry/utils", {
        vscode: mockVscode,
      });
      expect(utils.getHashedUser()).to.equal("");
    });
  });

  describe("getIAASParam", () => {
    let originalEnv: any;

    beforeEach(() => {
      originalEnv = { ...process.env };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it("should return iaas param if exists", () => {
      process.env.LANDSCAPE_INFRASTRUCTURE = "stg10.int";
      expect(utils.getIAASParam()).to.equal("stg10.int");
    });

    it("should return empty string if it doesnt exist", () => {
      expect(utils.getIAASParam()).to.equal("");
    });
  });

  describe("getDataCenterParam", () => {
    let originalEnv: any;

    beforeEach(() => {
      originalEnv = { ...process.env };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it("should return iaas param if exists", () => {
      process.env.LANDSCAPE_NAME = "landscape_name";
      expect(utils.getDataCenterParam()).to.equal("landscape_name");
    });

    it("should return empty string if it doesnt exist", () => {
      expect(utils.getDataCenterParam()).to.equal("");
    });
  });

  describe("getBASMode", () => {
    it("should return the current BAS mode", () => {
      sandbox.stub(devspace, "getBasMode").returns("standard");
      expect(utils.getBASMode()).to.equal("standard");
    });
  });

  describe("isTelemetryEnabled", () => {
    let sandbox: sinon.SinonSandbox;
    let utils: any;
    let mockVscode: any;
    let getConfigurationStub: sinon.SinonStub;
    let getExtensionRunPlatformStub: sinon.SinonStub;

    beforeEach(() => {
      sandbox = sinon.createSandbox();

      getConfigurationStub = sandbox.stub().returns({
        get: sandbox.stub().returns(true),
      });

      mockVscode = {
        env: {
          remoteName: "ssh-remote",
          machineId: "test-machine-id",
        },
        workspace: {
          getConfiguration: getConfigurationStub,
        },
      };
      getExtensionRunPlatformStub = sandbox
        .stub(basUtils, "getExtensionRunPlatform")
        .returns(ExtensionRunMode.desktop);

      utils = proxyquire.noCallThru().load("../../src/telemetry/utils", {
        vscode: mockVscode,
        "../../src/utils/bas-utils": {
          getExtensionRunPlatform: getExtensionRunPlatformStub,
        },
      });

      process.env.LANDSCAPE_ENVIRONMENT = "canary";
      process.env.WS_BASE_URL = "https://bas-url.com";
    });

    afterEach(() => {
      sandbox.restore();
    });

    it("should return true when analytics is enabled", () => {
      expect(utils.isTelemetryEnabled("sapse.vscode-extention-name")).to.be
        .true;
    });

    it("should return false when analytics is disabled", () => {
      getConfigurationStub.returns({ get: sandbox.stub().returns(false) });
      expect(utils.isTelemetryEnabled("sapse.vscode-extention-name")).to.be
        .false;
    });

    it("should return false when configuration is undefined", () => {
      getConfigurationStub.returns({ get: sandbox.stub().returns(undefined) });
      expect(utils.isTelemetryEnabled("sapse.vscode-extention-name")).to.be
        .false;
    });

    it("should return false when landscape is dev", () => {
      process.env.LANDSCAPE_ENVIRONMENT = "staging";
      expect(utils.isTelemetryEnabled("sapse.vscode-extention-name")).to.be
        .false;
    });

    it("should return false when run platform is unexpected", () => {
      getExtensionRunPlatformStub.returns(ExtensionRunMode.unexpected);
      expect(utils.isTelemetryEnabled("sapse.vscode-extention-name")).to.be
        .false;
    });

    it("should return false on error", () => {
      const consoleErrorStub = sandbox.stub(console, "error");
      getConfigurationStub.returns({
        get: sandbox.stub().throws(new Error("Test error")),
      });
      expect(utils.isTelemetryEnabled("sapse.vscode-extention-name")).to.be
        .false;
      expect(consoleErrorStub.calledWith(sinon.match.string)).to.be.true;
    });
  });
});
