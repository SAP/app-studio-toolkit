import { devspace } from "@sap/bas-sdk";
import { ExtensionRunMode, ANALYTICS_ENABLED_SETTING_NAME } from "./constants";
import { join, split, tail, isEmpty } from "lodash";
import * as crypto from "crypto";
import { URL } from "url";
import * as basUtils from "../../src/utils/bas-utils";

let vscode: any;
try {
  vscode = require("vscode");
} catch (e) {
  /* istanbul ignore next */
  console.error(`vscode is not available ${e}`);
}

/**
 * Helper function to detect if env var is provided before returning it.
 *
 * @param name Environment variable name
 * @returns Environment variable value
 */
export function getProcessEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.warn(`Environment variable ${name} does not exist.`);
  }
  return value ?? "";
}

export function isSAPUser(): string {
  const userName = getProcessEnv("USER_NAME");
  if (isEmpty(userName)) {
    return "";
  }
  return userName.endsWith("@sap.com").toString();
}

export function getIAASParam() {
  return getProcessEnv("LANDSCAPE_INFRASTRUCTURE");
}

export function getDataCenterParam() {
  return getProcessEnv("LANDSCAPE_NAME");
}

export function getHashedUser(): string {
  const userName = getProcessEnv("USER_NAME");
  if (!isEmpty(userName)) {
    return crypto.createHash("sha256").update(userName).digest("hex");
  } else {
    // For local VSCode
    return (vscode.env.machineId as string) ?? "";
  }
}

export function getBASMode(): devspace.BasMode {
  return devspace.getBasMode();
}

export function isTelemetryEnabled(extensionName: string): boolean {
  try {
    if (
      basUtils.getExtensionRunPlatform(extensionName) ===
      ExtensionRunMode.unexpected
    ) {
      // When running from non vscode extension context (e.g. tests, etc.)
      return false;
    } else if (
      /^(staging|ci|dev)$/.test(getProcessEnv("LANDSCAPE_ENVIRONMENT"))
    ) {
      // test environments - always don't report
      return false;
    } else {
      // non local & non dev environments - verify if setting is enabled
      // For local VSCode also return the setting value
      return (
        (vscode.workspace
          .getConfiguration()
          .get(ANALYTICS_ENABLED_SETTING_NAME) as boolean) ?? false
      );
    }
  } catch (e) {
    console.error(`Error while reading analytics setting: ${e}`);
    return false;
  }
}
