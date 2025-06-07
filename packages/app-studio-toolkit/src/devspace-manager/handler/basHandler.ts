import { EventEmitter, Uri, window, commands } from "vscode";
import type { UriHandler } from "vscode";
import { getLogger } from "../../logger/logger";
import * as sdk from "@sap/bas-sdk";
import { cmdLoginToLandscape, getLandscapes } from "../landscape/landscape";
import { isEmpty } from "lodash";
import { addLandscape } from "../landscape/set";
import { DevSpaceNode, LandscapeNode, TreeNode } from "../tree/treeItems";
import { DevSpaceDataProvider } from "../tree/devSpacesProvider";
import { cmdDevSpaceConnectNewWindow } from "../devspace/connect";
import { messages } from "../common/messages";
import { cmdDevSpaceStart } from "../devspace/update";
import { JwtPayload } from "@sap-devx/app-studio-toolkit-types";
import { URLSearchParams } from "node:url";

async function getDevSpace(landscape: LandscapeNode, devspaceidParam: string) {
  const devspaces = await landscape.getChildren(landscape);
  if (isEmpty(devspaces)) {
    throw new Error(messages.err_no_devspaces_in_landscape(landscape.name));
  }
  const devspace = devspaces.find((el) => el.id === devspaceidParam);
  if (!devspace) {
    throw new Error(messages.err_devspace_missing(devspaceidParam));
  }
  return devspace;
}

async function getDevspaceFromUrl(
  landscape: LandscapeNode,
  devspaceidParam: string
): Promise<TreeNode> {
  let devspace = await getDevSpace(landscape, devspaceidParam);
  // Start the dev space if it has not been started
  if (
    (devspace as DevSpaceNode).status !== sdk.devspace.DevSpaceStatus.RUNNING
  ) {
    await cmdDevSpaceStart(devspace as DevSpaceNode);
    devspace = await getDevSpace(landscape, devspaceidParam);
    // Verify the dev space has been started successfully
    if (
      (devspace as DevSpaceNode).status !== sdk.devspace.DevSpaceStatus.RUNNING
    ) {
      throw new Error(messages.err_devspace_must_be_started);
    }
  }
  return devspace;
}

async function getLandscapeFromUrl(
  devSpacesProvider: DevSpaceDataProvider,
  landscapeParam: string
): Promise<LandscapeNode> {
  const findLandscapeNode = async (): Promise<LandscapeNode> => {
    const node = (
      (await devSpacesProvider.getChildren()) as LandscapeNode[]
    ).find((el) => el.name === landscapeParam);
    if (!node) {
      throw new Error(messages.err_landscape_not_added(landscapeParam));
    }
    return node;
  };
  let isRefresh = false;
  const landscapes = await getLandscapes();
  const landscape = landscapes.find((el) => el.name === landscapeParam);
  if (!landscape) {
    await addLandscape(`https://${landscapeParam}`);
    isRefresh = true;
  }
  let landscapeNode = await findLandscapeNode();
  if (!/log-in/g.test(landscapeNode.contextValue ?? "")) {
    await cmdLoginToLandscape(landscapeNode);
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 1000));
    landscapeNode = await findLandscapeNode();
    isRefresh = true;
  }
  isRefresh && void commands.executeCommand("local-extension.tree.refresh");
  return landscapeNode;
}

function getParamFromUrl(
  query: string,
  name: string,
  optional = false
): string {
  const value = new URLSearchParams(query).get(name);
  if (!optional && !value) {
    throw new Error(messages.err_url_param_missing(query, name));
  }
  return value ?? "";
}

export interface LoginEvent extends Partial<JwtPayload> {}

// Create an instance of EventEmitter
export const eventEmitter = new EventEmitter<LoginEvent>();

function handleLogin(uri: Uri): void {
  // expected URL format:
  // vscode://SAPOSS.app-studio-toolkit/login?jwt=`value&iasjwt=`value
  const jwt = decodeURIComponent(getParamFromUrl(uri.query, "jwt"));
  const iasjwt = decodeURIComponent(getParamFromUrl(uri.query, "iasjwt", true));
  eventEmitter.fire({ jwt, iasjwt });
  getLogger().info("jwt(s) received");
}

async function handleOpen(
  uri: Uri,
  devSpacesProvider: DevSpaceDataProvider
): Promise<void> {
  // expected URL format :
  // vscode://SAPOSS.app-studio-toolkit/open?landscape=bas-extensions.stg10cf.int.applicationstudio.cloud.sap&devspaceid=ws-62qpt&folderpath=/home/user/projects/project1
  const landscape = await getLandscapeFromUrl(
    devSpacesProvider,
    getParamFromUrl(uri.query, `landscape`)
  );
  const devspace = await getDevspaceFromUrl(
    landscape,
    getParamFromUrl(uri.query, `devspaceid`)
  );
  let folderPath;
  try {
    folderPath = getParamFromUrl(uri.query, `folderpath`);
  } catch (_) {
    // folderath query param is optional.
  }
  void cmdDevSpaceConnectNewWindow(devspace as DevSpaceNode, folderPath);
}

export function getBasUriHandler(
  devSpacesProvider: DevSpaceDataProvider
): UriHandler {
  return {
    handleUri: async (uri: Uri): Promise<void> => {
      try {
        if (uri.path === "/open") {
          await handleOpen(uri, devSpacesProvider);
        } else if (uri.path === "/login") {
          handleLogin(uri);
        } else {
          throw new Error(
            messages.err_url_has_incorrect_format(uri.toString())
          );
        }
      } catch (err) {
        getLogger().error(messages.err_open_devspace_in_code(err.message));
        void window.showErrorMessage(
          messages.err_open_devspace_in_code(err.message)
        );
      }
    },
  };
}
