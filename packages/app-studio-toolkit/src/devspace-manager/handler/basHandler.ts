import { UriHandler, commands } from "vscode";
import { Uri, window } from "vscode";
import { getLogger } from "../../logger/logger";
import { DevSpaceStatus } from "../devspace/devspace";
import { cmdLoginToLandscape, getLandscapes } from "../landscape/landscape";
import { isEmpty } from "lodash";
import { addLandscape } from "../landscape/set";
import { DevSpaceNode, LandscapeNode, TreeNode } from "../tree/treeItems";
import { DevSpaceDataProvider } from "../tree/devSpacesProvider";
import { cmdDevSpaceConnectNewWindow } from "../devspace/connect";
import { messages } from "../common/messages";

async function getDevspaceFromUrl(
  landscape: LandscapeNode,
  devspaceidParam: string
): Promise<TreeNode> {
  const devspaces = await landscape.getChildren(landscape);
  if (isEmpty(devspaces)) {
    throw new Error(messages.err_no_devspaces_in_landscape(landscape.name));
  }
  const devspace = devspaces.find((el) => el.id === devspaceidParam);
  if (!devspace) {
    throw new Error(messages.err_devspace_missing(devspaceidParam));
  }
  if ((devspace as DevSpaceNode).status !== DevSpaceStatus.RUNNING) {
    throw new Error(messages.err_devspace_must_be_started);
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

function getParamFromUrl(query: string, name: string): string {
  const param = query
    .split("&")
    .find((el) => el.split("=")[0] === name)
    ?.split("=")[1];
  if (!param) {
    throw new Error(messages.err_url_param_missing(query, name));
  }
  return param;
}

export function getBasUriHandler(
  devSpacesProvider: DevSpaceDataProvider
): UriHandler {
  return {
    handleUri: async (uri: Uri): Promise<void> => {
      // expected URL format :
      // vscode://SAPOSS.app-studio-toolkit/open?landscape=bas-extensions.stg10cf.int.applicationstudio.cloud.sap&devspaceid=ws-62qpt
      try {
        if (uri.path !== "/open") {
          throw new Error(
            messages.err_url_has_incorrect_format(uri.toString())
          );
        }
        const landscape = await getLandscapeFromUrl(
          devSpacesProvider,
          getParamFromUrl(uri.query, `landscape`)
        );
        const devspace = await getDevspaceFromUrl(
          landscape,
          getParamFromUrl(uri.query, `devspaceid`)
        );
        void cmdDevSpaceConnectNewWindow(devspace as DevSpaceNode);
      } catch (err) {
        getLogger().error(messages.err_open_devspace_in_code(err.message));
        void window.showErrorMessage(
          messages.err_open_devspace_in_code(err.message)
        );
      }
    },
  };
}
