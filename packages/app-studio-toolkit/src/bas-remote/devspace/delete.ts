import { window, commands } from "vscode";
import { DevSpaceNode } from "../tree/treeItems";
import { getLogger } from "../../logger/logger";
import { messages } from "../messages";
import { getJwt } from "../../auth/authentication";
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
    if (!jwt) {
      throw new Error(`authorization token can't be obtained`);
    }
    await devspace.deleteDevSpace(landscapeUrl, wsId, jwt);
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
