import { TreeItemCollapsibleState, TreeItem, workspace, Uri } from "vscode";
import type { Command } from "vscode";
import * as path from "path";
import { messages } from "../messages";
import {
  DevSpaceInfo,
  DevSpaceStatus,
  getDevSpaces,
  PackName,
} from "../devspace/devspace";
import { devspace } from "@sap/bas-sdk";
import { $enum } from "ts-enum-util";
import { compact, get, isEmpty, map } from "lodash";
import { getLogger } from "../../logger/logger";

// export interface LandscapeNode {
//   label: string;
//   url: string;
// }
type IconPath = { light: string; dark: string } | string;

export function getSvgIconPath(iconName: string): IconPath {
  const icons = {
    landscape: { path: "common", name: "land.svg" },
    basic_error: { path: "devspace", name: "basic_error.svg" },
    basic_running: { path: "devspace", name: "basic_running.svg" },
    basic_not_running: { path: "devspace", name: "basic_not_running.svg" },
    cap_error: { path: "devspace", name: "cap_error.svg" },
    cap_running: { path: "devspace", name: "cap_running.svg" },
    cap_not_running: { path: "devspace", name: "cap_not_running.svg" },
    fiori_error: { path: "devspace", name: "fiori_error.svg" },
    fiori_running: { path: "devspace", name: "fiori_running.svg" },
    fiori_not_running: { path: "devspace", name: "fiori_not_running.svg" },
    sme_error: { path: "devspace", name: "sme_error" },
    sme_running: { path: "devspace", name: "sme_running.svg" },
    sme_not_running: { path: "devspace", name: "sme_not_running.svg" },
    mobile_error: { path: "devspace", name: "mobile_error.svg" },
    mobile_running: { path: "devspace", name: "mobile_running.svg" },
    mobile_not_running: { path: "devspace", name: "mobile_not_running.svg" },
    hana_error: { path: "devspace", name: "hana_error.svg" },
    hana_running: { path: "devspace", name: "hana_running.svg" },
    hana_not_running: { path: "devspace", name: "hana_not_running.svg" },
    lcap_error: { path: "devspace", name: "mobile_error.svg" },
    lcap_running: { path: "devspace", name: "cloud_running.svg" },
    lcap_not_running: { path: "devspace", name: "cloud_not_running.svg" },
  };
  let iconPath: IconPath = "";
  const property: { path: string; name: string } = get(icons, iconName);
  if (property) {
    iconPath = {
      light: path.join(
        __dirname,
        "..",
        "..",
        "..",
        "..",
        "resources",
        property.path,
        "light",
        property.name
      ),
      dark: path.join(
        __dirname,
        "..",
        "..",
        "..",
        "..",
        "resources",
        property.path,
        "dark",
        property.name
      ),
    };
  } else {
    getLogger().error(messages.ICON_MISSING(iconName));
  }
  return iconPath;
}

export abstract class TreeNode extends TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: TreeItemCollapsibleState,
    public readonly iconPath: IconPath,
    public readonly parentName: string,
    public readonly contextValue?: string,
    public readonly command?: Command,
    public readonly tooltip?: string,
    public readonly description?: string
  ) {
    super(label, collapsibleState);
  }

  public abstract getChildren(element?: TreeNode): Thenable<TreeNode[]>;
}

export class EmptyNode extends TreeNode {
  constructor(
    label: string,
    collapsibleState: TreeItemCollapsibleState,
    iconPath: string,
    parentName: string
  ) {
    super(label, collapsibleState, iconPath, parentName);
  }

  public getChildren(): Thenable<TreeNode[]> {
    return Promise.resolve([]);
  }
}

export class LoadingNode extends TreeNode {
  constructor(
    label: string,
    collapsibleState: TreeItemCollapsibleState,
    iconPath: string,
    parentName: string
  ) {
    super(label, collapsibleState, iconPath, parentName);
  }

  public getChildren(): Thenable<TreeNode[]> {
    return Promise.resolve([]);
  }
}

export class DevSpaceNode extends TreeNode {
  public readonly landscapeName: string;
  public readonly landscapeUrl: string;
  public readonly wsUrl: string;
  public readonly id: string;
  public readonly status: DevSpaceStatus;
  constructor(
    label: string,
    collapsibleState: TreeItemCollapsibleState,
    iconPath: IconPath,
    parentName: string,
    landscapeName: string,
    landscapeUrl: string,
    wsUrl: string,
    id: string,
    status: DevSpaceStatus,
    contextValue?: string,
    tooltip?: string,
    description?: string
  ) {
    super(
      label,
      collapsibleState,
      iconPath,
      parentName,
      contextValue,
      undefined,
      tooltip,
      description
    );
    this.landscapeName = landscapeName;
    this.landscapeUrl = landscapeUrl;
    this.wsUrl = wsUrl;
    this.id = id;
    this.status = status;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- suppress
  public getChildren(element?: TreeNode): Thenable<TreeNode[]> {
    return Promise.resolve([]);
  }
}

export class LandscapeNode extends TreeNode {
  public readonly name: string;
  public readonly url: string;
  constructor(
    label: string,
    collapsibleState: TreeItemCollapsibleState,
    iconPath: IconPath,
    parentName: string,
    tooltip: string,
    name: string,
    url: string,
    contextValue?: string
  ) {
    super(
      label,
      collapsibleState,
      iconPath,
      parentName,
      contextValue,
      undefined,
      tooltip
    );
    this.name = name;
    this.url = url;
  }

  private getLabel(devSpace: DevSpaceInfo): string {
    switch (devSpace.status) {
      case DevSpaceStatus.RUNNING:
      case DevSpaceStatus.STOPPED:
        return devSpace.devspaceDisplayName;
      case DevSpaceStatus.STARTING:
      case DevSpaceStatus.STOPPING:
      case DevSpaceStatus.SAFE_MODE:
      case DevSpaceStatus.ERROR:
        return `${
          devSpace.devspaceDisplayName
        } (${devSpace.status.toLowerCase()})`;
      default: {
        this.assertUnreachable(devSpace.status);
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- suppress warn
  private assertUnreachable(_x: never): never {
    throw new Error("Didn't expect to get here");
  }

  private getIconPath(devSpace: DevSpaceInfo): IconPath {
    const packName: string = $enum(PackName)
      .getKeyOrThrow(devSpace.pack)
      .toLowerCase();
    switch (devSpace.status) {
      case DevSpaceStatus.RUNNING: {
        const shorrten = `${packName}_running`;
        return getSvgIconPath(shorrten);
      }
      case DevSpaceStatus.STARTING:
      case DevSpaceStatus.STOPPED:
      case DevSpaceStatus.STOPPING: {
        const shorrten = `${packName}_not_running`;
        return getSvgIconPath(shorrten);
      }
      case DevSpaceStatus.SAFE_MODE:
      case DevSpaceStatus.ERROR:
        return getSvgIconPath(`${packName}_error`);
      default:
        this.assertUnreachable(devSpace.status);
    }
  }

  private getContextView(devSpace: DevSpaceInfo): string {
    switch (devSpace.status) {
      case DevSpaceStatus.RUNNING:
        return "dev-space-running";
      case DevSpaceStatus.STOPPED:
        return "dev-space-stopped";
      case DevSpaceStatus.STARTING:
      case DevSpaceStatus.STOPPING:
        return "dev-space-transitioning";
      case DevSpaceStatus.SAFE_MODE:
      case DevSpaceStatus.ERROR:
        return "dev-space-error";
      default:
        this.assertUnreachable(devSpace.status);
    }
  }

  public async getChildren(element: LandscapeNode): Promise<TreeNode[]> {
    const devSpaces = /log-in/g.test(element?.contextValue ?? "")
      ? await getDevSpaces(element.url)
      : [];
    let devSpaceNodes: TreeNode[] = isEmpty(devSpaces)
      ? [
          new EmptyNode(
            messages.DEV_SPACE_EXPLORER_AUTHENTICATION_FAILURE,
            TreeItemCollapsibleState.None,
            "",
            ""
          ),
        ]
      : compact(
          map(devSpaces, (devSpace) => {
            return new DevSpaceNode(
              this.getLabel(devSpace),
              TreeItemCollapsibleState.None,
              this.getIconPath(devSpace),
              element.label ?? "",
              element.name ?? "",
              element.url ?? "",
              devSpace.url,
              devSpace.id,
              devSpace.status,
              this.getContextView(devSpace),
              devSpace.id,
              devSpace.pack
            );
          })
        );

    if (isEmpty(devSpaceNodes)) {
      devSpaceNodes = [
        new EmptyNode(
          messages.DEV_SPACE_EXPLORER_NO_DEV_SPACES,
          TreeItemCollapsibleState.None,
          "",
          ""
        ),
      ];
    }
    return devSpaceNodes;
  }
}
