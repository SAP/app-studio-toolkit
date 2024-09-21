import {
  AuthenticationGetSessionOptions,
  QuickPickItem,
  QuickPickItemKind,
  authentication,
  commands,
  window,
} from "vscode";
import {
  LandscapeConfig,
  LandscapeInfo,
  getLandscapes,
  getLanscapesConfig,
  updateLandscapesConfig,
} from "../devspace-manager/landscape/landscape";
import { getLogger } from "../logger/logger";
import { BasRemoteAuthenticationProvider } from "../authentication/authProvider";
import { getJwt, hasJwt } from "../authentication/auth-utils";
import { isEmpty } from "lodash";
import express from "express";
import axios from "axios";
import cors from "cors";
import * as bodyParser from "body-parser";
import { createHttpTerminator } from "http-terminator";
import { Server } from "node:http";
import { devspace } from "@sap/bas-sdk";
import { URL } from "node:url";

const LBL_ADD_LANDSCAPE = "Add another landscape";

const OUTBOUND_PROXY = "43213";

function getAiLandscape(): string {
  return getLanscapesConfig().find((landscape) => landscape.ai)?.url ?? "";
}

export async function clearAiLandscape(
  update = true
): Promise<LandscapeConfig[]> {
  const configs = getLanscapesConfig();
  // reset ai flag for all landscapes if exists
  configs.forEach((landscape) => {
    delete landscape.ai;
  });
  update && (await updateLandscapesConfig(configs));
  return configs;
}

async function setAiLandscape(landscapeUrl: string): Promise<void> {
  const configs = await clearAiLandscape(false);
  // update landscape if it exists in the list or add it
  const index = configs.findIndex(
    (landscape) => landscape.url === landscapeUrl
  );
  if (index != -1) {
    // exists
    configs[index].ai = true;
  } else {
    // not exists : add the landscape to the list
    configs.push({ url: landscapeUrl, ai: true });
  }
  await updateLandscapesConfig(configs);
  void commands.executeCommand("local-extension.tree.refresh");
}

function selectLandscape(
  landscapes: LandscapeInfo[]
): Promise<QuickPickItem | undefined> {
  const items: QuickPickItem[] = landscapes.map((landscape) => ({
    url: landscape.url,
    label: landscape.name,
  }));
  items.unshift({ label: "", kind: QuickPickItemKind.Separator }); // existing items section separator
  items.push({ label: "", kind: QuickPickItemKind.Separator }); // action section separator
  items.push({ label: LBL_ADD_LANDSCAPE });
  return window.showQuickPick(items, {
    placeHolder: "Select the landscape in which you want to use Joule",
    ignoreFocusOut: true,
  }) as Promise<QuickPickItem | undefined>;
}

export async function setLandscapeForAiPurpose(
  landscape?: string
): Promise<boolean> {
  // select landscape for outbound connectivity
  let selectedLandscape: QuickPickItem | undefined;
  if (landscape) {
    selectedLandscape = { url: landscape } as any;
  } else {
    const outboundLandscape = getAiLandscape();
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
  }
  if (selectedLandscape) {
    await setAiLandscape((selectedLandscape as any).url);
  }
  return !!selectedLandscape;
}

async function verifyLandscape(): Promise<{
  status: "ok" | "error";
  jwt?: string;
  landscape?: string;
}> {
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
      return {
        status: "ok",
        jwt: await getJwt(outboundLandscape),
        landscape: outboundLandscape,
      };
    }
    // landscape is set - log in to it
    await authentication.getSession(
      BasRemoteAuthenticationProvider.id,
      [outboundLandscape],
      { forceNewSession: true } as AuthenticationGetSessionOptions
    );

    return (await hasJwt(outboundLandscape))
      ? {
          status: "ok",
          jwt: await getJwt(outboundLandscape),
          landscape: outboundLandscape,
        }
      : { status: "error" };
  } catch (error) {
    getLogger().error(error);
    return { status: "error" };
  }
}

let server: Server;

export function activateOutboundConnectivityServer(): void {
  const app = express();

  app.use(cors());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());

  app.all("/secure-outbound-connectivity/llm/*", async (req, res) => {
    function makeUrl(landscape: string, pathName: string): string {
      // compose the url to avoid wrong manually construction (e.g. missing slashes)
      const url = new URL(landscape);
      url.pathname = pathName;
      return url.toString();
    }

    try {
      const { status, jwt, landscape } = await verifyLandscape();
      if (status === "error" || !jwt || !landscape) {
        res.status(401).send("Unauthorized");
        return;
      }
      const tenantUrl = (await devspace.getTenantUrl({ landscape, jwt })) ?? "";
      const modifiedHeaders = {
        // ...req.headers,
        "X-Approuter-Authorization": `bearer ${jwt}`,
        "Al-Resource-Group": "default",
      };

      // Forward request to another URL with modified headers
      const response = await axios({
        method: req.method,
        url: makeUrl(`https://${tenantUrl}`, req.originalUrl),
        headers: modifiedHeaders,
        data: req.body,
      });

      // Send the response back to the original client
      res.status(response.status).send(response.data);
    } catch (err) {
      const status = err.response?.status ?? 500;
      const error = err.response?.data ?? err.toString();
      getLogger().error(
        `outbound-connectivity request failed:: status: ${status}, error: ${error}`
      );
      res.status(status).send(error);
    }
  });

  /* istanbul ignore next */
  server = app.listen(OUTBOUND_PROXY, () => {
    getLogger().info(`CORS-enabled outbound-connectivity server listening ...`);
  });

  server.on("error", function (err: { message: string }) {
    getLogger().error(`outbound-connectivity server error: ${err.message}`);
  });
}

export function deactivateOutboundConnectivityServerServer(): void {
  void createHttpTerminator({ server }).terminate();
  getLogger().info("The outbound-connectivity server is deactivated.");
}
