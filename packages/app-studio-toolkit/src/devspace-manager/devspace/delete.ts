import { window, commands } from "vscode";
import { DevSpaceNode } from "../tree/treeItems";
import { getLogger } from "../../logger/logger";
import { messages } from "../common/messages";
import { getJwt } from "../../authentication/auth-utils";
import { devspace } from "@sap/bas-sdk";

export async function cmdDevSpaceDelete(devSpace: DevSpaceNode): Promise<void> {
  const selection = await window.showInformationMessage(
    messages.lbl_delete_devspace(devSpace.label, devSpace.id),
    ...[messages.lbl_yes, messages.lbl_no]
  );
  if (selection == messages.lbl_yes) {
    return deleteDevSpace(devSpace.landscapeUrl, devSpace.id);
  }
}

async function deleteDevSpace(landscapeUrl: string, wsId: string) {
  try {
    const jwt = await getJwt(landscapeUrl);
    await devspace.deleteDevSpace(landscapeUrl, jwt, wsId);
    const message = messages.info_devspace_deleted(wsId);
    getLogger().info(message);
    void window.showInformationMessage(message);
    void commands.executeCommand("local-extension.tree.refresh");
  } catch (e) {
    const message = messages.err_devspace_delete(wsId, e.toString());
    getLogger().error(message);
    void window.showErrorMessage(message);
  }
}
