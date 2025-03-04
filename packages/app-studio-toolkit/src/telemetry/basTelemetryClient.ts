import * as appInsights from "applicationinsights";
import { EventHeader } from "./eventHeader";
import { getTelemetryClient } from "./telemetryInit";
import {
  isTelemetryEnabled,
  isSAPUser,
  getIAASParam,
  getDataCenterParam,
  getBASMode,
  getHashedUser,
} from "./utils";
import { getExtensionRunPlatform } from "../utils/bas-utils";
import {
  TelemetryProperties,
  TelemetryMeasurements,
} from "@sap-devx/app-studio-toolkit-types";

/**
 * Singelton class to send telemetry events to Azure Application Insights.
 */
export class BASTelemetryClient {
  private extensionName: string;
  private extensionVersion: string;
  private appInsightsClient: appInsights.TelemetryClient;

  constructor(extensionName: string, extensionVersion: string) {
    this.appInsightsClient = getTelemetryClient();
    this.extensionName = extensionName;
    this.extensionVersion = extensionVersion;
  }

  /**
   * @returns Consumer module name
   */
  public getExtensionName(): string {
    return this.extensionName;
  }

  /**
   * @returns Consumer module version
   */
  public getExtensionVersion(): string {
    return this.extensionVersion;
  }

  /**
   * Send a telemetry event to Azure Application Insights. The telemetry event sending is still non-blocking
   * in this API.
   *
   * @param eventName Categorize the type of the event within the scope of an extension.
   * @param properties A set of string properties to be reported
   * @param measurements  A set of numeric measurements to be reported
   */
  public report(
    eventName: string,
    properties: TelemetryProperties = {},
    measurements: TelemetryMeasurements = {}
  ): Promise<void> {
    if (isTelemetryEnabled(this.extensionName)) {
      const telementryEvent = this.prepareEvent(
        eventName,
        properties,
        measurements
      );
      this.appInsightsClient.trackEvent(telementryEvent);
    }
    return Promise.resolve();
  }

  /**
   * Provide specification of telemetry event to be sent.
   *
   * @param eventName Categorize the type of the event within the scope of an extension.
   * @param properties A set of string properties to be reported
   * @param measurements A set of numeric measurements to be reported
   * @returns telemetry event
   */
  private prepareEvent(
    eventName: string,
    properties: TelemetryProperties,
    measurements: TelemetryMeasurements
  ): appInsights.Contracts.EventTelemetry {
    const eventHeader: EventHeader = new EventHeader(
      this.extensionName,
      eventName
    );

    // Automatically add additional properties to the event
    properties["iaas"] = getIAASParam();
    properties["landscape"] = getDataCenterParam();
    properties["is_sap_user"] = isSAPUser();
    properties["bas_mode"] = getBASMode();
    properties["extension_run_platform"] = getExtensionRunPlatform(
      this.extensionName
    );
    properties["extension_version"] = this.extensionVersion;
    properties["hashed_user"] = getHashedUser();

    const event: appInsights.Contracts.EventTelemetry = {
      name: eventHeader.toString(),
      properties: properties as Record<string, string>,
      measurements: measurements,
    };

    return event;
  }
}
