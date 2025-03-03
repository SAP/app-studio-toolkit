import { BASTelemetryClient } from "./basTelemetryClient";
import { ITelemetryReporter } from "@sap-devx/app-studio-toolkit-types";

export class BASClientFactory {
  private static basTelemetryClientsMap = new Map<string, BASTelemetryClient>();

  public static getBASTelemetryClient(
    extensionId: string,
    extensionVersion: string
  ): ITelemetryReporter {
    const key = `${extensionId}-${extensionVersion}`;
    if (!BASClientFactory.basTelemetryClientsMap.has(key)) {
      BASClientFactory.basTelemetryClientsMap.set(
        key,
        new BASTelemetryClient(extensionId, extensionVersion)
      );
    }
    return BASClientFactory.basTelemetryClientsMap.get(key)!;
  }
}
