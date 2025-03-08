import { window, commands, env, Uri } from "vscode";
import { DevSpaceNode } from "../tree/treeItems";
import urljoin from "url-join";
import { getLogger } from "../../../src/logger/logger";
import { messages } from "../common/messages";

export async function closeTunnels(): Promise<void> {
  await commands.executeCommand("remote-access.close-tunnel");
}

export async function cmdDevSpaceConnectNewWindow(
  devSpace: DevSpaceNode,
  folderPath: string | undefined
): Promise<void> {
  return commands.executeCommand(
    "remote-access.dev-space.connect-new-window",
    devSpace,
    folderPath
  );
}

export async function cmdDevSpaceOpenInBAS(
  devSpace: DevSpaceNode
): Promise<boolean> {
  try {
    return env.openExternal(
      Uri.parse(urljoin(devSpace.landscapeUrl, `index.html`, `#${devSpace.id}`))
    );
  } catch (err) {
    getLogger().error(
      messages.err_open_devspace_in_bas(devSpace.landscapeUrl, err.message)
    );
    void window.showErrorMessage(
      messages.err_open_devspace_in_bas(devSpace.landscapeUrl, err.message)
    );
    return false;
  }
}
