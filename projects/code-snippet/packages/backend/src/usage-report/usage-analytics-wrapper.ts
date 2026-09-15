import {
  initTelemetrySettings,
  BASClientFactory,
  BASTelemetryClient,
} from "@sap/swa-for-sapbas-vsx";
import { IChildLogger } from "@vscode-logging/logger";
import { join } from "path";
import { readFileSync } from "fs";

/**
 * A Simple Wrapper for reporting usage analytics
 */
export class AnalyticsWrapper {
  // Event types used by Application Wizard
  private static readonly EVENT_TYPES = {
    SNIPPET_CREATION_STARTED: "Snippet creation started",
    SNIPPET_CREATION_SUCCESSFULLY: "Snippet creation successfully",
    SNIPPET_CREATION_FAILED: "Snippet creation failed",
  };

  private static startTime: number = Date.now();

  /**
   * Note the use of a getter function so the value would be lazy resolved on each use.
   * This enables concise and simple consumption of the tracker throughout our Extension.
   *
   * @returns { Tracker }
   */
  public static getTracker(): BASTelemetryClient {
    return BASClientFactory.getBASTelemetryClient();
  }

  public static createTracker(logger?: IChildLogger): void {
    try {
      const packageJsonPath = join(__dirname, "..", "package.json");
      const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
      const vscodeExtentionFullName = `${packageJson.publisher}.${packageJson.name}`;
      initTelemetrySettings(vscodeExtentionFullName, packageJson.version);
      logger?.info(
        `SAP Web Analytics tracker was created for ${vscodeExtentionFullName}`
      );
    } catch (error: any) {
      logger?.error(error);
    }
  }

  private static report(opt: {
    eventName: string;
    properties?: any;
    logger?: IChildLogger;
  }): void {
    // We want to report only if we are not in Local VSCode environment
    const eventName = opt.eventName;
    if (process.env.LANDSCAPE_ENVIRONMENT) {
      void AnalyticsWrapper.getTracker().report(opt.eventName, opt.properties);
      opt.logger?.trace("SAP Web Analytics tracker was called", {
        eventName,
      });
    } else {
      opt.logger?.trace(
        "SAP Web Analytics tracker was not called because LANDSCAPE_ENVIRONMENT is not set",
        {
          eventName,
        }
      );
    }
  }

  public static updateSnippetStarted(
    snippetName: string,
    logger?: IChildLogger
  ): void {
    try {
      const eventName = AnalyticsWrapper.EVENT_TYPES.SNIPPET_CREATION_STARTED;
      AnalyticsWrapper.startTime = Date.now();
      const properties = { snippetName };
      AnalyticsWrapper.report({ eventName, properties, logger });
    } catch (error: any) {
      logger?.error(error);
    }
  }

  public static updateSnippetEnded(
    snippetName: string,
    isSucceeded: boolean,
    logger?: IChildLogger,
    errorMessage?: string
  ): void {
    try {
      const eventName = isSucceeded
        ? AnalyticsWrapper.EVENT_TYPES.SNIPPET_CREATION_SUCCESSFULLY
        : AnalyticsWrapper.EVENT_TYPES.SNIPPET_CREATION_FAILED;
      const endTime = Date.now();
      const snippetTimeMilliSec = endTime - AnalyticsWrapper.startTime;
      const snippetTimeSec = Math.round(snippetTimeMilliSec / 1000);
      const properties: any = {
        snippetName,
        snippetTime: snippetTimeSec.toString(),
      };
      if (errorMessage) {
        properties.push(errorMessage);
      }
      AnalyticsWrapper.report({ eventName, properties, logger });
    } catch (error: any) {
      logger?.error(error);
    }
  }
}
