import { TreeItemCollapsibleState, EventEmitter, TreeItem } from "vscode";
import type { TreeDataProvider, Event } from "vscode";
import {
  TreeNode,
  LandscapeNode,
  LoadingNode,
  getSvgIconPath,
} from "./treeItems";
import { messages } from "../common/messages";
import { getLandscapes } from "../landscape/landscape";
import { compact, map } from "lodash";

export class DevSpaceDataProvider implements TreeDataProvider<TreeItem> {
  // Instance elements
  public privateOnDidChangeTreeData: EventEmitter<TreeItem | undefined> =
    new EventEmitter<TreeItem | undefined>();
  public readonly onDidChangeTreeData: Event<TreeItem | undefined> =
    this.privateOnDidChangeTreeData.event;
  private loading = false;
  constructor(private readonly extensionPath: string) {}

  public setLoading(loading: boolean): void {
    this.loading = loading;
  }

  public refresh(): void {
    this.privateOnDidChangeTreeData.fire(undefined);
  }

  public getTreeItem(element: TreeNode): TreeItem {
    return element;
  }

  public async getChildren(element?: TreeNode): Promise<TreeNode[]> {
    // TODO: Implement loading of tree scenario
    if (this.loading) {
      return Promise.resolve([
        new LoadingNode(
          messages.DEV_SPACE_EXPLORER_LOADING,
          TreeItemCollapsibleState.None,
          "",
          ""
        ),
      ]);
    }
    return this.getChildrenPromise(element);
  }

  private async getChildrenPromise(element?: TreeNode): Promise<TreeNode[]> {
    // Get the children of the given element
    if (element) {
      return element.getChildren(element);
    }
    // Get the children of the root
    return this.getTreeTopLevelChildren();
  }

  private async getTreeTopLevelChildren(): Promise<Thenable<TreeNode[]>> {
    const iconPath = getSvgIconPath(this.extensionPath, "landscape");
    const landscapes = await getLandscapes();

    const rootNodes = compact(
      map(landscapes, (landscape) => {
        return new LandscapeNode(
          this.extensionPath,
          landscape.name,
          TreeItemCollapsibleState.Expanded,
          iconPath,
          "",
          landscape.isLoggedIn ? "Logged in" : "Not logged in",
          landscape.name,
          landscape.url,
          `landscape-${landscape.isLoggedIn ? "log-in" : "log-out"}`
        );
      })
    );

    return rootNodes;
  }
}
