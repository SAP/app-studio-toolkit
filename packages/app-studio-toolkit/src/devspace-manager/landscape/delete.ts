import { window, commands } from "vscode";
import { messages } from "../messages";
import { LandscapeNode } from "../tree/treeItems";
import { removeLandscape } from "./landscape";

export async function cmdLandscapeDelete(
  landscape: LandscapeNode
): Promise<void> {
  const answer = await window.showInformationMessage(
    messages.lbl_delete_landscape(landscape.label),
    ...[messages.lbl_yes, messages.lbl_no]
  );
  if (answer == messages.lbl_yes) {
    await removeLandscape(landscape.url);
    void commands.executeCommand("local-extension.tree.refresh");
  }
}