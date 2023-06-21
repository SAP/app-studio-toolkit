import { window, commands, env, Uri } from "vscode";
import { DevSpaceNode } from "../tree/treeItems";
import urljoin from "url-join";
import { getLogger } from "../../../src/logger/logger";
import { messages } from "../common/messages";

export async function closeTunnel(): Promise<void> {
  try {
    await commands.executeCommand("remote-access.close-tunnel");
  } catch (err) {
    getLogger().error(`Can't communicate "remote-access": ${err.toString()}`);
  }
}

export async function cmdDevSpaceConnectNewWindow(
  devSpace: DevSpaceNode
): Promise<void> {
  try {
    await commands.executeCommand(
      "remote-access.dev-space.connect-new-window",
      devSpace
    );
  } catch (err) {
    const message = `Can't connect the devspace ${
      devSpace.wsUrl
    }: ${err.toString()}`;
    getLogger().error(message);
    void window.showErrorMessage(message);
  }
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
