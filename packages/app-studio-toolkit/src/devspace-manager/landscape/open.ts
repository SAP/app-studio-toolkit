import { env, Uri } from "vscode";
import { LandscapeNode } from "../tree/treeItems";

export async function cmdLandscapeOpenDevSpaceManager(
  landscape: LandscapeNode
): Promise<boolean> {
  return env.openExternal(Uri.parse(landscape.url));
}
