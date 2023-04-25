import {
  authentication,
  commands,
  ConfigurationTarget,
  workspace,
  window,
  Uri,
  TreeItemCollapsibleState,
  env,
} from "vscode";
import type { ExtensionContext } from "vscode";
import { DevSpacesExplorer } from "./tree/devSpacesExplorer";
import { DevSpaceNode, LandscapeNode, TreeNode } from "./tree/treeItems";
import { cmdLandscapeDelete } from "./landscape/delete";
import { addLandscape, cmdLandscapeSet } from "./landscape/set";
import { cmdLandscapeOpenDevSpaceManager } from "./landscape/open";
import { cmdDevSpaceDelete } from "./devspace/delete";
import { cmdDevSpaceStart, cmdDevSpaceStop } from "./devspace/update";
import { cmdDevSpaceAdd } from "./devspace/add";
import { cmdDevSpaceEdit } from "./devspace/edit";
import { cmdCopyWsId } from "./devspace/copy";
import {
  closeTunnel,
  cmdDevSpaceConnectNewWindow,
  cmdDevSpaceOpenInBAS,
} from "./devspace/connect";
import { BasRemoteAuthenticationProvider } from "../../src/authentication/authProvider";
import { cmdLoginToLandscape } from "./landscape/landscape";
import { getLandscapes } from "./landscape/landscape";
import { DevSpaceInfo, getDevSpaces } from "./devspace/devspace";
import { DevSpaceStatus } from "./devspace/devspace";
import { error } from "console";
import { getLogger } from "../../src/logger/logger";
import { devspace, devspaceApi } from "@sap/bas-sdk";

export async function initBasRemoteExplorer(
  context: ExtensionContext
): Promise<void> {
  // workaround for preventing the generic vscode welcome screen
  await workspace
    .getConfiguration()
    .update("workbench.startupEditor", "none", ConfigurationTarget.Global);

  context.subscriptions.push(
    commands.registerCommand("local-extension.tree.settings", () =>
      commands.executeCommand("workbench.action.openSettings", "Desktop Client")
    )
  );

  const devSpaceExplorer = new DevSpacesExplorer(context.extensionPath);

  /* istanbul ignore next */
  context.subscriptions.push(
    commands.registerCommand("local-extension.tree.refresh", () =>
      devSpaceExplorer.refreshTree()
    )
  );

  context.subscriptions.push(
    commands.registerCommand(
      "local-extension.dev-space.connect-new-window",
      cmdDevSpaceConnectNewWindow
    )
  );

  context.subscriptions.push(
    commands.registerCommand(
      "local-extension.dev-space.open-in-bas",
      cmdDevSpaceOpenInBAS
    )
  );

  context.subscriptions.push(
    commands.registerCommand(
      "local-extension.dev-space.start",
      cmdDevSpaceStart
    )
  );

  context.subscriptions.push(
    commands.registerCommand("local-extension.dev-space.stop", cmdDevSpaceStop)
  );

  context.subscriptions.push(
    commands.registerCommand(
      "local-extension.dev-space.delete",
      cmdDevSpaceDelete
    )
  );

  context.subscriptions.push(
    commands.registerCommand("local-extension.dev-space.add", cmdDevSpaceAdd)
  );

  context.subscriptions.push(
    commands.registerCommand("local-extension.dev-space.edit", cmdDevSpaceEdit)
  );

  context.subscriptions.push(
    commands.registerCommand(
      "local-extension.dev-space.copy-ws-id",
      cmdCopyWsId
    )
  );

  context.subscriptions.push(
    commands.registerCommand(
      "local-extension.landscape.open-dev-space-manager",
      cmdLandscapeOpenDevSpaceManager
    )
  );

  context.subscriptions.push(
    commands.registerCommand("local-extension.landscape.add", cmdLandscapeSet)
  );

  context.subscriptions.push(
    commands.registerCommand(
      "local-extension.landscape.delete",
      cmdLandscapeDelete
    )
  );

  context.subscriptions.push(
    commands.registerCommand("local-extension.landscape.set", cmdLandscapeSet)
  );

  context.subscriptions.push(
    commands.registerCommand("local-extension.login", cmdLoginToLandscape)
  );

  context.subscriptions.push(
    commands.registerCommand(
      "local-extension.command.open-in-bas",
      cmdOpenInVSCode
    )
  );

  context.subscriptions.push(
    authentication.registerAuthenticationProvider(
      BasRemoteAuthenticationProvider.id,
      "Bussines Application Studio", // TODO get official string
      new BasRemoteAuthenticationProvider(context.secrets),
      { supportsMultipleAccounts: true }
    )
  );

  window.registerUriHandler({
    async handleUri(uri: Uri) {
      let errorMessage = undefined;
      // URL format should be
      // vscode://SAPOSS.app-studio-toolkit/open?landscape=bas-extensions.stg10cf.int.applicationstudio.cloud.sap&devspaceid=ws-62qpt
      try {
        if (uri.path === "/open") {
          const landscapeParam = uri.query
            .split("&")
            .find((el) => el.split("=")[0] === "landscape")
            ?.split("=")[1];
          const devspaceidParam = uri.query
            .split("&")
            .find((el) => el.split("=")[0] === "devspaceid")
            ?.split("=")[1];

          let landscape;
          ({ landscape, errorMessage } = await getLandscapeFromUrl(
            landscapeParam,
            errorMessage,
            uri
          ));

          let devspace;
          ({ devspace, errorMessage } = await getDevspaceFromUrl(
            landscape.url,
            errorMessage,
            uri,
            devspaceidParam
          ));

          if (devspace) {
            const devspaceNode: DevSpaceNode = {
              landscapeName: landscape.name,
              landscapeUrl: landscape.url,
              wsUrl: devspace.url,
              id: devspace.id,
              status: devspace.status,
              label: devspace.devspaceDisplayName,
              getChildren: function (
                element?: TreeNode | undefined
              ): Thenable<TreeNode[]> {
                throw new Error("Function not implemented.");
              },
              collapsibleState: TreeItemCollapsibleState.None,
              iconPath: "",
              parentName: "",
            };
            if (devspace.status === DevSpaceStatus.RUNNING) {
              void cmdDevSpaceConnectNewWindow(devspaceNode);
            } else {
              const message = `DevSpace must be started before running it`;
              void window.showErrorMessage(message);
            }
          } else {
            errorMessage = `Devspace ${devspaceidParam} is missing`;
          }
        } else {
          errorMessage = `URL ${uri.toString()} has incorrect format`;
        }
      } catch (err) {
        errorMessage = `Can't open the devspace: ${err.toString()}`;
      }

      if (errorMessage) {
        getLogger().error(errorMessage);
        void window.showErrorMessage(errorMessage);
      }
    },
  });
}

async function getDevspaceFromUrl(
  landscapeUrl: string,
  errorMessage: any,
  uri: Uri,
  devspaceidParam: string | undefined
) {
  if (!devspaceidParam) {
    errorMessage = `Devspace parameter is missing from URL '${uri.toString()}'`;
    throw error(errorMessage);
  }

  const devspaces = await getDevSpaces(landscapeUrl);
  if (!devspaces || devspaces.length === 0) {
    errorMessage = "There are no devspaces in this landscape";
  }
  const devspace = devspaces?.find((el) => el.id === devspaceidParam);

  if (!devspaces || devspaces.length === 0) {
    errorMessage = `Devspace ${devspaceidParam} is missing`;
  }
  return { devspace, errorMessage };
}

async function getLandscapeFromUrl(
  landscapeParam: string | undefined,
  errorMessage: any,
  uri: Uri
) {
  if (!landscapeParam) {
    errorMessage = `Landscape parameter is missing from URL '${uri.toString()}'`;
    throw error(errorMessage);
  }

  let landscapes = await getLandscapes();
  if (!landscapes || landscapes.length === 0) {
    await addLandscape("https://" + landscapeParam);
    landscapes = await getLandscapes();
  }

  let landscape = landscapes.find((el) => el.name === landscapeParam);

  if (!landscape) {
    await addLandscape("https://" + landscapeParam);
    landscapes = await getLandscapes();
    landscape = landscapes.find((el) => el.name === landscapeParam);
  }

  if (!landscape) {
    errorMessage = `Falied to add landscape '${uri.toString()}'`;
    throw error(errorMessage);
  }

  if (!landscape.isLoggedIn) {
    const landscapeNode: LandscapeNode = new LandscapeNode(
      "",
      landscape.name,
      TreeItemCollapsibleState.None,
      "",
      "",
      "",
      landscape.name,
      landscape.url,
      undefined
    );
    void cmdLoginToLandscape(landscapeNode);
  }

  return { landscape, errorMessage };
}

function cmdOpenInVSCode(): void {
  const workspaceId = process.env.WORKSPACE_ID?.substring(11);
  const landscape = process.env.H2O_URL?.substring(8);

  const url = `vscode://SAPOSS.app-studio-toolkit/open?landscape=${landscape}&devspaceid=${workspaceId}`;
  const uri = Uri.parse(url);
  void env.openExternal(uri);
}

export function deactivateBasRemoteExplorer(): void {
  // kill opened ssh channel if exists
  closeTunnel();
}
