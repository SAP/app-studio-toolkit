import { window, commands } from "vscode";
import { DevSpaceNode } from "../tree/treeItems";
import { getLogger } from "../../logger/logger";
import { messages } from "../common/messages";
import { getJwt } from "../../authentication/auth-utils";
import { devspace } from "@sap/bas-sdk";
import {
  cleanRemotePlatformSetting,
  deletePK,
  removeSSHConfig,
} from "../tunnel/ssh-utils";

export async function cmdDevSpaceDelete(devSpace: DevSpaceNode): Promise<void> {
  const selection = await window.showInformationMessage(
    messages.lbl_delete_devspace(devSpace.label, devSpace.id),
    ...[messages.lbl_yes, messages.lbl_no]
  );
  if (selection == messages.lbl_yes) {
    try {
      await deleteDevSpace(devSpace.landscapeUrl, devSpace.id);
      await cleanDevspaceConfig(devSpace);
      const message = messages.info_devspace_deleted(devSpace.id);
      getLogger().info(message);
      void window.showInformationMessage(message);
    } catch (e) {
      const message = messages.err_devspace_delete(devSpace.id, e.toString());
      getLogger().error(message);
      void window.showErrorMessage(message);
    } finally {
      void commands.executeCommand("local-extension.tree.refresh");
    }
  }
}

async function deleteDevSpace(
  landscapeUrl: string,
  wsId: string
): Promise<void> {
  return devspace.deleteDevSpace(
    landscapeUrl,
    await getJwt(landscapeUrl),
    wsId
  );
}

async function cleanDevspaceConfig(devSpace: DevSpaceNode): Promise<void> {
  try {
    deletePK(devSpace.wsUrl);
    removeSSHConfig(devSpace);
    await cleanRemotePlatformSetting(devSpace);
    getLogger().info(`Devspace ssh config info cleaned`);
  } catch (e) {
    getLogger().error(
      `Can't complete the devspace ssh config cleaning: ${e.toString()}`
    );
  }
}
