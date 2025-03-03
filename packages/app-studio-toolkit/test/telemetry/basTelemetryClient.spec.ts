import { expect } from "chai";
import sinon from "sinon";
import * as appInsights from "applicationinsights";
import { BASTelemetryClient } from "../../src/telemetry/basTelemetryClient";
import * as utils from "../../src/telemetry/utils";
import * as telemetryInit from "../../src/telemetry/telemetryInit";
import { ExtensionRunMode } from "../../src/telemetry/constants";
import * as basUtils from "../../src/utils/bas-utils";

describe("BASTelemetryClient", function () {
  let telemetryClient: any,
    mockAppInsightsClient: any,
    isTelemetryEnabledStub: any;

  beforeEach(function () {
    mockAppInsightsClient = {
      trackEvent: sinon.spy(),
    };
    sinon.stub(appInsights, "TelemetryClient").returns(mockAppInsightsClient);
    isTelemetryEnabledStub = sinon
      .stub(utils, "isTelemetryEnabled")
      .returns(true);
    sinon.stub(utils, "getIAASParam").returns("mockIAAS");
    sinon.stub(utils, "getDataCenterParam").returns("mockDataCenter");
    sinon.stub(utils, "isSAPUser").returns("true");
    sinon.stub(utils, "getBASMode").returns("standard");
    sinon.stub(utils, "getHashedUser").returns("mockHashedUser");
    sinon
      .stub(telemetryInit, "initializeTelemetry")
      .returns(mockAppInsightsClient);

    sinon
      .stub(basUtils, "getExtensionRunPlatform")
      .returns(ExtensionRunMode.desktop);
    telemetryClient = new BASTelemetryClient("TestExtension", "1.0.0");
  });

  afterEach(function () {
    sinon.restore();
  });

  it("should return the correct extension name", function () {
    expect(telemetryClient.getExtensionName()).to.equal("TestExtension");
  });

  it("should return the correct extension version", function () {
    expect(telemetryClient.getExtensionVersion()).to.equal("1.0.0");
  });

  it("should call trackEvent when telemetry is enabled", async function () {
    await telemetryClient.report("testEvent", { key: "value" }, { metric: 1 });
    expect(mockAppInsightsClient.trackEvent.calledOnce).to.be.true;
  });

  it("should not call trackEvent when telemetry is disabled", async function () {
    isTelemetryEnabledStub.returns(false);
    await telemetryClient.report("testEvent", { key: "value" }, { metric: 1 });
    expect(mockAppInsightsClient.trackEvent.called).to.be.false;
  });

  it("should include additional properties in the telemetry event", async function () {
    await telemetryClient.report("testEvent");
    const eventArgs = mockAppInsightsClient.trackEvent.getCall(0).args[0];
    expect(eventArgs.properties).to.include({
      iaas: "mockIAAS",
      landscape: "mockDataCenter",
      is_sap_user: "true",
      bas_mode: "standard",
      extension_run_platform: ExtensionRunMode.desktop,
      extension_version: "1.0.0",
      hashed_user: "mockHashedUser",
    });
    // expect also measurements
    expect(eventArgs.measurements).to.be.empty;
  });

  it("should include additional properties and measurements in the telemetry event", async function () {
    await telemetryClient.report("testEvent", { key: "value" }, { metric: 1 });
    const eventArgs = mockAppInsightsClient.trackEvent.getCall(0).args[0];
    expect(eventArgs.properties).to.include({
      iaas: "mockIAAS",
      landscape: "mockDataCenter",
      is_sap_user: "true",
      bas_mode: "standard",
      extension_run_platform: ExtensionRunMode.desktop,
      extension_version: "1.0.0",
      hashed_user: "mockHashedUser",
      key: "value",
    });
    expect(eventArgs.measurements).to.include({ metric: 1 });
  });
});
