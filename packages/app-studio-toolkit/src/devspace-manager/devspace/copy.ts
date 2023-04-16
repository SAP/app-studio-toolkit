import { env, window } from "vscode";
import { messages } from "../common/messages";
import { DevSpaceNode } from "../tree/treeItems";
import { getLogger } from "../../../src/logger/logger";

export async function cmdCopyWsId(devSpace: DevSpaceNode): Promise<void> {
  try {
    await env.clipboard.writeText(devSpace.id);
    void window.showInformationMessage(messages.info_wsid_copied);
  } catch (err) {
    const message = `Can't copy devspace identificator: ${err.message}`;
    getLogger().error(message);
    void window.showErrorMessage(message);
  }
}
