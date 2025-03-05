import { setup, defaultClient, TelemetryClient } from "applicationinsights";
import { APPINSIGHTS_CONNECTION_STRING } from "./constants";

let telemetryClient: TelemetryClient | null = null;

export function getTelemetryClient() {
  if (!telemetryClient) {
    setup(APPINSIGHTS_CONNECTION_STRING);

    // Configure sample rate. 100 is the default and means all collected data will be sent to the Application Insights service
    // If you want to enable sampling to reduce the amount of data, set the samplingPercentage. 0 means nothing will be sent.
    defaultClient.config.samplingPercentage = 100;

    // Disable GDPR private data that are collected by Azure AppInsight client.
    defaultClient.addTelemetryProcessor((envelope: any) => {
      envelope.tags["ai.location.ip"] = "0.0.0.0";
      envelope.tags["ai.cloud.roleInstance"] = "masked";
      envelope.tags["ai.cloud.role"] = "masked";
      envelope.tags["ai.cloud.roleVer"] = "masked";
      envelope.tags["ai.device.type"] = "masked";

      return true;
    });
    telemetryClient = defaultClient;
  }

  return telemetryClient;
}

// For testing purpose
export function setTelemetryClient(client: TelemetryClient | null) {
  telemetryClient = client;
}
