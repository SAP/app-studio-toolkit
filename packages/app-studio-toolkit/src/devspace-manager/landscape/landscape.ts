import {
  AuthenticationGetSessionOptions,
  ConfigurationTarget,
  authentication,
  commands,
  workspace,
} from "vscode";
import { compact, isEmpty, size, trim, uniqBy } from "lodash";
import { hasJwt, timeUntilJwtExpires } from "../../authentication/auth-utils";
import { URL } from "node:url";
import { getLogger } from "../../../src/logger/logger";
import { LandscapeNode } from "../tree/treeItems";
import { BasRemoteAuthenticationProvider } from "../../authentication/authProvider";

export function autoRefresh(refreshRate?: number, timeOut?: number): void {
  refreshRate = refreshRate ?? 10 * 1000; // 10 sec default
  timeOut = timeOut ?? 2 * 60 * 1000; // 2 min default
  let refreshedTime = 0;
  const refreshInterval: NodeJS.Timer = setInterval(() => {
    getLandscapes()
      .then((landscapes) => {
        if (refreshedTime < timeOut! && !isEmpty(landscapes)) {
          refreshedTime += refreshRate!;
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
  ai?: boolean;
}

export type LandscapeConfig = { url: string; ai?: boolean };

function isLandscapeLoggedIn(url: string): Promise<boolean> {
  return hasJwt(url);
}

export function getLanscapesConfig(): LandscapeConfig[] {
  let config =
    workspace.getConfiguration().get<string>("sap-remote.landscape-name") ?? "";
  // check if it is an old format - replace `,` with `|` - TODO: remove this in future (backward compatibility)
  if (!/.*\{.+\}.*/.test(config)) {
    config = config.replace(/,/g, "|");
  }
  // split by | and parse each landscape
  return uniqBy(
    compact(
      config.split("|").map((landscape) => {
        try {
          const item: LandscapeConfig = JSON.parse(landscape);
          return Object.assign(
            { url: item.url },
            item.ai ? { ai: item.ai } : {}
          );
        } catch (e) {
          // if not a valid JSON - consider it as a URL - TODO: remove this in future (backward compatibility)
          if (trim(landscape).length > 0) {
            return { url: landscape };
          }
        }
      })
    ),
    "url"
  );
}

export async function updateLandscapesConfig(
  values: LandscapeConfig[]
): Promise<void> {
  const value = values.map((item) => JSON.stringify(item)).join("|");
  return workspace
    .getConfiguration()
    .update("sap-remote.landscape-name", value, ConfigurationTarget.Global)
    .then(() => {
      getLogger().debug(`Landscapes config updated: ${value}`);
    });
}

export async function getLandscapes(): Promise<LandscapeInfo[]> {
  const lands: LandscapeInfo[] = [];
  for (const landscape of getLanscapesConfig()) {
    const url = new URL(landscape.url);
    lands.push(
      Object.assign(
        {
          name: url.hostname,
          url: url.toString(),
          isLoggedIn: await isLandscapeLoggedIn(landscape.url),
        },
        landscape.ai ? { ai: landscape.ai } : {}
      )
    );
  }
  return lands;
}

export async function removeLandscape(landscapeName: string): Promise<void> {
  const config = getLanscapesConfig();
  if (size(config) > 0) {
    const toRemove = new URL(landscapeName).toString();
    const updated = config.filter(
      (landscape) => new URL(landscape.url).toString() !== toRemove
    );
    if (size(updated) !== size(config)) {
      return updateLandscapesConfig(updated);
    }
  }
}

export async function cmdLoginToLandscape(node: LandscapeNode): Promise<void> {
  try {
    const session = await authentication.getSession(
      BasRemoteAuthenticationProvider.id,
      [node.url],
      { forceNewSession: true } as AuthenticationGetSessionOptions
    );
    if (session?.accessToken) {
      // auto refresh util jwt expired
      autoRefresh(30 * 1000, timeUntilJwtExpires(session.accessToken));
    }
  } finally {
    void commands.executeCommand("local-extension.tree.refresh");
  }
}
