import { env, window } from "vscode";
import { messages } from "../common/messages";
import { DevSpaceNode } from "../tree/treeItems";

export async function cmdCopyWsId(devSpace: DevSpaceNode): Promise<void> {
  await env.clipboard.writeText(devSpace.id);
  void window.showInformationMessage(messages.info_wsid_copied);
}
