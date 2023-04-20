import { env, window } from "vscode";
import { messages } from "../common/messages";
import { DevSpaceNode } from "../tree/treeItems";
import { getLogger } from "../../../src/logger/logger";

export async function cmdCopyWsId(devSpace: DevSpaceNode): Promise<void> {
  try {
    await env.clipboard.writeText(devSpace.id);
    void window.showInformationMessage(messages.info_wsid_copied);
  } catch (err) {
    getLogger().error(messages.err_copy_devspace_id(err.message));
    void window.showErrorMessage(messages.err_copy_devspace_id(err.message));
  }
}
