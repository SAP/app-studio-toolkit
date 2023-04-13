import { window, TreeItem } from "vscode";
import type { TreeView } from "vscode";
import { DevSpaceDataProvider } from "./devSpacesProvider";

export class DevSpacesExplorer {
  private readonly devSpacesExplorerView: TreeView<TreeItem>;
  private readonly devSpacesExplorerProvider: DevSpaceDataProvider;

  constructor(extensionPath: string) {
    this.devSpacesExplorerProvider = new DevSpaceDataProvider(extensionPath);
    this.devSpacesExplorerView = window.createTreeView("dev-spaces", {
      treeDataProvider: this.devSpacesExplorerProvider,
      showCollapseAll: true,
    });
  }

  public refreshTree(): void {
    this.devSpacesExplorerProvider.refresh();
  }

  public changeTreeToLoading(): void {
    this.devSpacesExplorerProvider.setLoading(true);
    this.refreshTree();
  }

  public changeTreeToLoaded(): void {
    this.devSpacesExplorerProvider.setLoading(false);
    this.refreshTree();
  }

  public getDevSpacesExplorerProvider(): DevSpaceDataProvider {
    return this.devSpacesExplorerProvider;
  }

  public getDevSpacesExplorerView(): TreeView<TreeItem> {
    return this.devSpacesExplorerView;
  }
}
