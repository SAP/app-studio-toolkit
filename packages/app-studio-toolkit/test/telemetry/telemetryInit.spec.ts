import { expect } from "chai";
import sinon from "sinon";
import * as appInsights from "applicationinsights";
import {
  getTelemetryClient,
  setTelemetryClient,
} from "../../src/telemetry/telemetryInit";

describe("getTelemetryClient", function () {
  let addTelemetryProcessorStub: sinon.SinonStub;
  let configStub: { samplingPercentage: number };

  beforeEach(function () {
    configStub = { samplingPercentage: 50 };
    addTelemetryProcessorStub = sinon.stub();

    // @ts-expect-error - test only
    appInsights.defaultClient.config = configStub;
    appInsights.defaultClient.addTelemetryProcessor = addTelemetryProcessorStub;
  });

  afterEach(function () {
    sinon.restore();
  });

  it("should set sampling percentage to 50 (existing telemetry default client settings)", function () {
    const client = getTelemetryClient();
    expect(client.config.samplingPercentage).to.equal(50);
  });

  it("should add a telemetry processor that masks sensitive data (new telemetry default client settings)", function () {
    setTelemetryClient(null);
    getTelemetryClient();

    expect(addTelemetryProcessorStub.calledOnce).to.be.true;

    // Simulate processing an envelope
    const telemetryProcessor = addTelemetryProcessorStub.firstCall.args[0];
    const envelope = { tags: {} };
    telemetryProcessor(envelope);

    expect(envelope.tags).to.deep.equal({
      "ai.location.ip": "0.0.0.0",
      "ai.cloud.roleInstance": "masked",
      "ai.cloud.roleVer": "masked",
      "ai.cloud.role": "masked",
      "ai.device.type": "masked",
    });
  });
});
