import { commands, ConfigurationTarget, workspace } from "vscode";
import type { ExtensionContext } from "vscode";
import { DevSpacesExplorer } from "./tree/devSpacesExplorer";
import { LandscapeNode } from "./tree/treeItems";
import { getJwt } from "../authentication/auth-utils";
import { cmdLandscapeDelete } from "./landscape/delete";
import { cmdLandscapeSet } from "./landscape/set";
import { cmdLandscapeOpenDevSpaceManager } from "./landscape/open";
import { cmdDevSpaceDelete } from "./devspace/delete";
import { cmdDevSpaceStart, cmdDevSpaceStop } from "./devspace/update";
import { cmdDevSpaceAdd } from "./devspace/add";
import { cmdDevSpaceEdit } from "./devspace/edit";
import { cmdCopyWsId } from "./devspace/copy";
import {
  cmdDevSpaceConnectNewWindow,
  cmdDevSpaceConnectSameWindow,
  cmdDevSpaceOpenInBAS,
} from "./devspace/connect";

export async function initBasRemoteExplorer(
  context: ExtensionContext
): Promise<void> {
  // workaround for preventing the generic vscode welcome screen
  await workspace
    .getConfiguration()
    .update("workbench.startupEditor", "none", ConfigurationTarget.Global);

  // General Commands
  context.subscriptions.push(
    commands.registerCommand("local-extension.tree.settings", () =>
      commands.executeCommand("workbench.action.openSettings", "Desktop Client")
    )
  );

  // // Tree Commands
  const devSpaceExplorer = new DevSpacesExplorer();
  context.subscriptions.push(
    commands.registerCommand("local-extension.tree.refresh", () =>
      devSpaceExplorer.refreshTree()
    )
  );

  // Dev space commands
  context.subscriptions.push(
    commands.registerCommand(
      "local-extension.dev-space.connect-new-window",
      cmdDevSpaceConnectNewWindow
    )
  );

  context.subscriptions.push(
    commands.registerCommand(
      "local-extension.dev-space.connect-same-window",
      cmdDevSpaceConnectSameWindow
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

  // Landscape commands
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
    commands.registerCommand(
      "local-extension.login",
      async (item: LandscapeNode) => {
        return getJwt(item.url).finally(() => devSpaceExplorer.refreshTree());
      }
    )
  );
}

export function deactivateBasRemoteExplorer(): void {
  // kill opened ssh channel if exists
  // closeTunnel();
}
