import {
  AuthenticationGetSessionOptions,
  QuickPickItem,
  QuickPickItemKind,
  authentication,
  commands,
  window,
} from "vscode";
import {
  LandscapeInfo,
  getLandscapes,
  getLanscapesConfig,
  updateLandscapesConfig,
} from "../devspace-manager/landscape/landscape";
import { getLogger } from "../logger/logger";
import { BasRemoteAuthenticationProvider } from "../authentication/authProvider";
import { hasJwt } from "../authentication/auth-utils";
import { isEmpty } from "lodash";

const LBL_ADD_LANDSCAPE = "Add landscape";

function getAiLandscape(): string {
  return getLanscapesConfig().find((landscape) => landscape.ai)?.url ?? "";
}

async function setAiLandscape(value: string): Promise<void> {
  const configs = getLanscapesConfig();
  // reset ai flag for all landscapes if exists
  configs.forEach((landscape) => {
    delete landscape.ai;
  });
  // update landscape if it exists in the list or add it
  const index = configs.findIndex((landscape) => landscape.url === value);
  if (index != -1) {
    // exists
    configs[index].ai = true;
  } else {
    // not exists : add the landscape to the list
    configs.push({ url: value, ai: true });
  }
  return updateLandscapesConfig(configs);
}

function selectLandscape(
  landscapes: LandscapeInfo[]
): Promise<QuickPickItem | undefined> {
  const items: QuickPickItem[] = landscapes.map((landscape) => ({
    url: landscape.url,
    label: landscape.name,
  }));
  items.unshift({ label: "Available", kind: QuickPickItemKind.Separator }); // existing items section separator
  items.push({ label: "Initiate", kind: QuickPickItemKind.Separator }); // action section separator
  items.push({ label: LBL_ADD_LANDSCAPE });
  return window.showQuickPick(items, {
    placeHolder: "Choose the landscape to use for AI purposes",
    ignoreFocusOut: true,
  }) as Promise<QuickPickItem | undefined>;
}

export async function setLandscapeForAiPurpose(): Promise<boolean> {
  const outboundLandscape = getAiLandscape();
  // select landscape for outbound connectivity
  let selectedLandscape: QuickPickItem | undefined;
  do {
    // remove selected ai landscape from the list
    const landscapes = (await getLandscapes()).filter(
      (item) => item.url !== outboundLandscape
    );
    selectedLandscape = await selectLandscape(landscapes);
    if (selectedLandscape?.label === LBL_ADD_LANDSCAPE) {
      await commands.executeCommand("local-extension.landscape.add");
    }
  } while (selectedLandscape?.label === LBL_ADD_LANDSCAPE);

  if (selectedLandscape) {
    await setAiLandscape((selectedLandscape as any).url);
  }
  return !!selectedLandscape;
}

export async function sendRequest(request: any): Promise<any> {
  async function verifyLandscape(): Promise<boolean> {
    try {
      let outboundLandscape = getAiLandscape();
      if (!outboundLandscape) {
        // if landscape is not set - it means that user has not selected any landscape
        if (!(await setLandscapeForAiPurpose())) {
          throw new Error("AI landscape is not set");
        }
        outboundLandscape = getAiLandscape();
      }
      const found = (await getLandscapes()).filter(
        (item) => item.url === outboundLandscape
      );
      if (isEmpty(found)) {
        throw new Error("invalid landscape");
      }
      if (found[0].isLoggedIn) {
        return true;
      }
      // landscape is set - log in to it
      await authentication.getSession(
        BasRemoteAuthenticationProvider.id,
        [outboundLandscape],
        { forceNewSession: true } as AuthenticationGetSessionOptions
      );
      return hasJwt(outboundLandscape);
    } catch (error) {
      getLogger().error(error);
      return false;
    }
  }

  if (await verifyLandscape()) {
    void window.showInformationMessage(
      `Sending request to ${getAiLandscape()}`
    );
  }
}
