import {
  initTelemetrySettings,
  BASClientFactory,
  BASTelemetryClient,
} from "@sap/swa-for-sapbas-vsx";
import { join } from "path";
import { readFileSync } from "fs";
import { getLogger } from "../logger/logger";

type Properties = { [key: string]: string | boolean };
type Measurements = { [key: string]: number };
type ProjectData = { [type: string]: number };

/**
 * A Simple Wrapper for reporting usage analytics
 */
export class AnalyticsWrapper {
  private static readonly EVENT_TYPES = {
    PROJECT_TYPES_STATUS: "Project Types Status",
  };

  public static getTracker(): BASTelemetryClient {
    return BASClientFactory.getBASTelemetryClient();
  }

  public static createTracker(extensionPath: string): void {
    try {
      const packageJsonPath = join(extensionPath, "package.json");
      const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
      const vscodeExtentionFullName = `${packageJson.publisher}.${packageJson.name}`;
      initTelemetrySettings(vscodeExtentionFullName, packageJson.version);
      getLogger().info(
        `SAP Web Analytics tracker was created for ${vscodeExtentionFullName}`
      );
    } catch (error: any) {
      getLogger().error(error);
    }
  }

  private static report(opt: {
    eventName: string;
    properties: Properties;
    measurements?: Measurements;
  }): void {
    // We want to report only if we are not in Local VSCode environment
    if (process.env.LANDSCAPE_ENVIRONMENT) {
      void AnalyticsWrapper.getTracker().report(
        opt.eventName,
        { ...opt.properties },
        { ...opt.measurements }
      );
      getLogger().trace("SAP Web Analytics tracker was called", {
        eventName: opt.eventName,
      });
    }
  }

  public static traceProjectTypesStatus(
    devSpacePackName: string,
    projects: ProjectData
  ): void {
    try {
      const eventName = AnalyticsWrapper.EVENT_TYPES.PROJECT_TYPES_STATUS;
      for (const type in projects) {
        let projectType;
        switch (type) {
          case "com.sap.cap":
            projectType = "CAP";
            break;
          case "com.sap.ui":
            projectType = "UI5";
            break;
          case "com.sap.mdk":
            projectType = "MDK";
            break;
          case "com.sap.fe":
            projectType = "FE";
            break;
          case "com.sap.hana":
            projectType = "HANA";
            break;
          case "com.sap.lcap":
            projectType = "LCAP";
            break;
          default:
            projectType = "BASEmpty";
        }
        AnalyticsWrapper.report({
          eventName,
          properties: { projectType, devSpacePackName },
          measurements: { projectTypeQuantity: projects[type] },
        });
      }
    } catch (error: any) {
      getLogger().error(error);
    }
  }
}

export { BASClientFactory, BASTelemetryClient };
