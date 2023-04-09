import { LandscapeNode } from "../tree/treeItems";
import { RefreshRate, autoRefresh } from "../landscape/landscape";

export async function cmdDevSpaceAdd(landscape: LandscapeNode): Promise<void> {
  await new Promise((resolve, reject) => setTimeout(() => resolve(true), 100));
  autoRefresh(RefreshRate.SEC_10, RefreshRate.MIN_3);
}
