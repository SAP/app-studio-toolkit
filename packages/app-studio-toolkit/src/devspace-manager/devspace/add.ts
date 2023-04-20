import { LandscapeNode } from "../tree/treeItems";
import { autoRefresh } from "../landscape/landscape";

export async function cmdDevSpaceAdd(landscape: LandscapeNode): Promise<void> {
  // dummy async delay until a real implementation will created
  await new Promise((resolve, reject) => setTimeout(() => resolve(true), 100));
  autoRefresh();
}
