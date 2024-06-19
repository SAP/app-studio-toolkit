import { TreeItemCollapsibleState, EventEmitter, TreeItem } from "vscode";
import type { TreeDataProvider, Event } from "vscode";
import {
  TreeNode,
  LandscapeNode,
  LoadingNode,
  getSvgIconPath,
} from "./treeItems";
import { getLandscapes } from "../landscape/landscape";
import { map } from "lodash";
import { messages } from "../common/messages";

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
      return Promise.resolve([new LoadingNode(TreeItemCollapsibleState.None)]);
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
    const landscapes = await getLandscapes();

    const rootNodes = map(landscapes, (landscape) => {
      let tooltip = landscape.isLoggedIn
        ? messages.lbl_logged_in
        : messages.lbl_not_logged_in;
      if (landscape.ai) {
        tooltip += `, ${messages.lbl_ai_enabled}`;
      }
      return new LandscapeNode(
        this.extensionPath,
        landscape.name,
        TreeItemCollapsibleState.Expanded,
        getSvgIconPath(
          this.extensionPath,
          `landscape${landscape.ai ? "_ai" : ""}`
        ),
        "",
        tooltip,
        landscape.name,
        landscape.url,
        messages.lbl_landscape_context_status(
          landscape.isLoggedIn,
          landscape.ai
        )
      );
    });

    return rootNodes;
  }
}
