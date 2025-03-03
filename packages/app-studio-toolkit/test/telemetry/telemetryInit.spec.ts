import { expect } from "chai";
import sinon from "sinon";
import * as appInsights from "applicationinsights";
import { initializeTelemetry } from "../../src/telemetry/telemetryInit";

describe("initializeTelemetry", function () {
  let addTelemetryProcessorStub: sinon.SinonStub;
  let configStub: { samplingPercentage: number };

  beforeEach(function () {
    configStub = { samplingPercentage: 0 };
    addTelemetryProcessorStub = sinon.stub();

    // @ts-expect-error - test only
    appInsights.defaultClient.config = configStub;
    appInsights.defaultClient.addTelemetryProcessor = addTelemetryProcessorStub;
  });

  afterEach(function () {
    sinon.restore();
  });

  it("should set sampling percentage to 100", function () {
    const client = initializeTelemetry();
    expect(client.config.samplingPercentage).to.equal(100);
  });

  it("should add a telemetry processor that masks sensitive data", function () {
    initializeTelemetry();

    expect(addTelemetryProcessorStub.calledOnce).to.be.true;

    // Simulate processing an envelope
    const telemetryProcessor = addTelemetryProcessorStub.firstCall.args[0];
    const envelope = { tags: {} };
    telemetryProcessor(envelope);

    expect(envelope.tags).to.deep.equal({
      "ai.location.ip": "0.0.0.0",
      "ai.cloud.roleInstance": "masked",
      "ai.cloud.role": "masked",
      "ai.device.type": "masked",
    });
  });
});
