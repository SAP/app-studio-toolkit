import {
  AuthenticationGetSessionOptions,
  ConfigurationTarget,
  QuickPickItem,
  QuickPickItemKind,
  authentication,
  commands,
  window,
  workspace,
} from "vscode";
import { core } from "@sap/bas-sdk";
import { compact, isEmpty, size, trim, uniqBy } from "lodash";
import { hasJwt } from "../../authentication/auth-utils";
import { URL } from "node:url";
import { getLogger } from "../../logger/logger";
import { LandscapeNode } from "../tree/treeItems";
import { BasRemoteAuthenticationProvider } from "../../authentication/authProvider";

const LBL_ADD_LANDSCAPE = "Add another landscape";
const DEFAULT_REFRESH_RATE = 10 * 1000; // 10 sec default
const DEFAULT_TIMEOUT = 2 * 60 * 1000; // 2 min default

const autoRefreshTimerArray: NodeJS.Timer[] = [];

export function clearAutoRefreshTimers(): void {
  autoRefreshTimerArray.forEach((interval) => {
    clearInterval(interval);
  });
  autoRefreshTimerArray.splice(0, autoRefreshTimerArray.length);
}

export function autoRefresh(
  refreshRate = DEFAULT_REFRESH_RATE,
  timeOut = DEFAULT_TIMEOUT
): void {
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
          const index = autoRefreshTimerArray.indexOf(refreshInterval);
          /* istanbul ignore else */
          if (index !== -1) {
            autoRefreshTimerArray.splice(index, 1); // Remove one item at the found index
          }
        }
      })
      .catch((e) => {
        getLogger().error(`getLandscapes error: ${e.toString()}`);
      });
  }, refreshRate);
  autoRefreshTimerArray.push(refreshInterval);
}

interface QuickPickLandscape extends QuickPickItem {
  url?: string;
}

export interface LandscapeInfo {
  name: string;
  url: string;
  isLoggedIn: boolean;
  default?: boolean;
}

export type LandscapeConfig = { url: string; default?: boolean };

function isLandscapeLoggedIn(url: string): Promise<boolean> {
  return hasJwt(url);
}

export function getLanscapesConfig(): LandscapeConfig[] {
  // example:
  //  - new format:  {"url":"https://example.com","default":true}|{"url":"https://example2.com"}
  //  - old format:  https://example.com,https://example2.com
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
            { url: new URL(item.url).toString() },
            item.default ? { default: item.default } : {}
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
        landscape.default ? { default: landscape.default } : {}
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
      autoRefresh(30 * 1000, core.timeUntilJwtExpires(session.accessToken));
    }
  } finally {
    void commands.executeCommand("local-extension.tree.refresh");
  }
}

export function getDefaultLandscape(): string {
  return getLanscapesConfig().find((landscape) => landscape.default)?.url ?? "";
}

export async function clearDefaultLandscape(
  updateLandsConfig = true
): Promise<LandscapeConfig[]> {
  const configs = getLanscapesConfig();
  // reset 'default' flag for all landscapes if exists
  configs.forEach((landscape) => {
    delete landscape.default;
  });
  updateLandsConfig && (await updateLandscapesConfig(configs));
  return configs;
}

async function markDefaultLandscape(landscapeUrl: string): Promise<void> {
  const configs = await clearDefaultLandscape(false);
  // update landscape if it exists in the list or add it
  const index = configs.findIndex(
    (landscape) => landscape.url === landscapeUrl
  );
  if (index != -1) {
    // exists
    configs[index].default = true;
  } else {
    // not exists : add the landscape to the list
    configs.push({ url: landscapeUrl, default: true });
  }
  await updateLandscapesConfig(configs);
  void commands.executeCommand("local-extension.tree.refresh");
  getLogger().info(`Default landscape set to: ${landscapeUrl}`);
}

function selectLandscape(
  landscapes: LandscapeInfo[]
): Promise<QuickPickLandscape | undefined> {
  const items: QuickPickLandscape[] = landscapes.map((landscape) => ({
    url: landscape.url,
    label: landscape.name,
  }));
  items.unshift({ label: "", kind: QuickPickItemKind.Separator }); // existing items section separator
  items.push({ label: "", kind: QuickPickItemKind.Separator }); // action section separator
  items.push({ label: LBL_ADD_LANDSCAPE });
  return window.showQuickPick(items, {
    placeHolder: "Select the landscape you want to use as default",
    ignoreFocusOut: true,
  }) as Promise<QuickPickLandscape | undefined>;
}

export async function setDefaultLandscape(
  landscape?: string
): Promise<boolean> {
  // select landscape as the 'default' one
  let selectedLandscape: QuickPickLandscape | undefined;
  const defaultLandscape = getDefaultLandscape();
  if (landscape) {
    if (defaultLandscape) {
      const isContinue = await window.showInformationMessage(
        `The ${defaultLandscape} landscape is currently defined as the default landscape.\nDo you want to make the ${landscape} landscape the default instead?`,
        { modal: true },
        "Yes"
      );
      if (!isContinue) {
        return false;
      }
    }
    selectedLandscape = { url: landscape } as any;
  } else {
    do {
      // remove selected default landscape from the list
      const landscapes = (await getLandscapes()).filter(
        (item) => item.url !== defaultLandscape
      );
      selectedLandscape = await selectLandscape(landscapes);
      if (selectedLandscape?.label === LBL_ADD_LANDSCAPE) {
        await commands.executeCommand("local-extension.landscape.add");
      }
    } while (selectedLandscape?.label === LBL_ADD_LANDSCAPE);
  }
  if (selectedLandscape?.url) {
    await markDefaultLandscape(selectedLandscape.url);
  }
  return !!selectedLandscape;
}

// for testing
export const internal = {
  autoRefreshTimerArray,
};
