import { expect } from "chai";
import sinon from "sinon";
import { BASTelemetryClient } from "../../src/telemetry/basTelemetryClient";
import { baseBasToolkitAPI } from "../../src/public-api/base-bas-api";

describe("BASClientFactory", function () {
  let createStubInstance;

  beforeEach(function () {
    createStubInstance = sinon.stub(BASTelemetryClient.prototype);
  });

  afterEach(function () {
    sinon.restore();
  });

  it("should return the same instance for the same extensionId and extensionVersion", function () {
    const client1 = baseBasToolkitAPI.getTelemetryReporter(
      "testExtension",
      "1.0.0"
    );
    const client2 = baseBasToolkitAPI.getTelemetryReporter(
      "testExtension",
      "1.0.0"
    );
    expect(client1).to.equal(client2);
  });

  it("should create a new instance for a different extensionId or extensionVersion", function () {
    const client1 = baseBasToolkitAPI.getTelemetryReporter(
      "testExtension",
      "1.0.0"
    );
    const client2 = baseBasToolkitAPI.getTelemetryReporter(
      "testExtension",
      "2.0.0"
    );
    expect(client1).to.not.equal(client2);
  });
});
