import { authentication, commands, window } from "vscode";
import type { ExtensionContext } from "vscode";
import { DevSpacesExplorer } from "./tree/devSpacesExplorer";
import { cmdLandscapeDelete } from "./landscape/delete";
import { cmdLandscapeSet } from "./landscape/set";
import { cmdLandscapeOpenDevSpaceManager } from "./landscape/open";
import { cmdDevSpaceDelete } from "./devspace/delete";
import { cmdDevSpaceStart, cmdDevSpaceStop } from "./devspace/update";
import { cmdDevSpaceAdd } from "./devspace/add";
import { cmdDevSpaceEdit } from "./devspace/edit";
import { cmdCopyWsId } from "./devspace/copy";
import {
  closeTunnels,
  cmdDevSpaceConnectNewWindow,
  cmdDevSpaceOpenInBAS,
} from "./devspace/connect";
import { BasRemoteAuthenticationProvider } from "../authentication/authProvider";
import {
  clearAutoRefreshTimers,
  clearDefaultLandscape,
  cmdLoginToLandscape,
  getDefaultLandscape,
  setDefaultLandscape,
} from "./landscape/landscape";
import { getBasUriHandler } from "./handler/basHandler";
import { cmdOpenInVSCode } from "./devspace/open";
import { LandscapeNode } from "./tree/treeItems";

export function initBasRemoteExplorer(context: ExtensionContext): void {
  context.subscriptions.push(
    commands.registerCommand("local-extension.tree.settings", () =>
      commands.executeCommand("workbench.action.openSettings", "sap-remote")
    )
  );

  const devSpaceExplorer = new DevSpacesExplorer(context.extensionPath);

  /* istanbul ignore next */
  context.subscriptions.push(
    commands.registerCommand(
      "app-studio-toolkit.devspace-manager.landscape.default-on",
      async (node?: LandscapeNode): Promise<boolean> =>
        setDefaultLandscape(node?.url)
    )
  );

  context.subscriptions.push(
    commands.registerCommand(
      "app-studio-toolkit.devspace-manager.landscape.default-off",
      async (node: LandscapeNode): Promise<void> => {
        await clearDefaultLandscape();
        void commands.executeCommand("local-extension.tree.refresh");
      }
    )
  );

  context.subscriptions.push(
    commands.registerCommand(
      "app-studio-toolkit.devspace-manager.get-default-landscape",
      getDefaultLandscape
    )
  );

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
      "local-extension.dev-space.open-in-code",
      cmdOpenInVSCode
    )
  );

  context.subscriptions.push(
    authentication.registerAuthenticationProvider(
      BasRemoteAuthenticationProvider.id,
      "SAP Business Application Studio",
      new BasRemoteAuthenticationProvider(context.secrets)
    )
  );

  context.subscriptions.push(
    window.registerUriHandler(
      getBasUriHandler(devSpaceExplorer.getDevSpacesExplorerProvider())
    )
  );

  // Add the event listener to subscriptions for cleanup
  context.subscriptions.push(
    authentication.onDidChangeSessions((e) => {
      // Check if this was a sign out event
      if (e.provider.id === BasRemoteAuthenticationProvider.id) {
        // Get current sessions
        void authentication
          .getSession(BasRemoteAuthenticationProvider.id, [], { silent: true })
          .then((session) => {
            // If session is null or undefined, user has signed out
            if (!session) {
              clearAutoRefreshTimers();
              void closeTunnels();
            }
          });
      }
    })
  );
}

export function deactivateBasRemoteExplorer(): Promise<void> {
  clearAutoRefreshTimers();
  // kill opened ssh channel if exists
  return closeTunnels();
}
