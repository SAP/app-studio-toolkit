import { ConfigurationTarget, commands, workspace } from "vscode";
import { compact, isEmpty, size, trim, uniq } from "lodash";
import { hasJwt } from "../../authentication/auth-utils";
import { URL } from "node:url";
import { getLogger } from "../../../src/logger/logger";

export enum RefreshRate {
  ALWAYS = -1,
  SEC_5 = 5 * 1000,
  SEC_10 = 10 * 1000,
  SEC_15 = 15 * 1000,
  SEC_30 = 30 * 1000,
  MIN_2 = 2 * 60 * 1000,
  MIN_3 = 3 * 60 * 1000,
}

export function autoRefresh(refreshRate: number, timeOut: number): void {
  let refreshedTime = 0;
  const refreshInterval: NodeJS.Timer = setInterval(() => {
    getLandscapes()
      .then((landscapes) => {
        if (refreshedTime < timeOut && !isEmpty(landscapes)) {
          refreshedTime += refreshRate;
          getLogger().info(`Auto refresh ${refreshedTime} out of ${timeOut}`);
          void commands.executeCommand("local-extension.tree.refresh");
        } else {
          getLogger().info(`Auto refresh completed`);
          clearInterval(refreshInterval);
        }
      })
      .catch((e) => {
        getLogger().error(`getLandscapes error: ${e.toString()}`);
      });
  }, refreshRate);
}

export interface LandscapeInfo {
  name: string;
  url: string;
  isLoggedIn: boolean;
}

function isLandscapeLoggedIn(url: string): Promise<boolean> {
  return hasJwt(url);
}

export function getLanscapesConfig(): string[] {
  return uniq(
    compact(
      (
        workspace.getConfiguration().get<string>("sap-remote.landscape-name") ??
        ""
      )
        .split(",")
        .map((value) => trim(value))
    )
  );
}

export async function updateLandscapesConfig(value: string[]): Promise<void> {
  return workspace
    .getConfiguration()
    .update(
      "sap-remote.landscape-name",
      value.join(","),
      ConfigurationTarget.Global
    )
    .then(() => {
      getLogger().debug(`Landscapes config updated: ${value.toString()}`);
    });
}

export async function getLandscapes(): Promise<LandscapeInfo[]> {
  const lands: LandscapeInfo[] = [];
  for (const landscape of getLanscapesConfig()) {
    const url = new URL(landscape);
    lands.push({
      name: url.hostname,
      url: url.toString(),
      isLoggedIn: await isLandscapeLoggedIn(landscape),
    });
  }
  return lands;
}

export async function removeLandscape(landscapeName: string): Promise<void> {
  const config = getLanscapesConfig();
  if (size(config) > 0) {
    const toRemove = new URL(landscapeName).toString();
    const updated = config.filter(
      (landscape) => new URL(landscape).toString() !== toRemove
    );
    if (size(updated) !== size(config)) {
      return updateLandscapesConfig(updated);
    }
  }
}
