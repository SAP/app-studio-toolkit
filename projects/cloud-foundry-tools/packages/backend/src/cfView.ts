import * as vscode from "vscode";
import * as path from "path";
import * as _ from "lodash";
import { cfGetApps, cfGetServiceInstancesList, cfGetTargets, CFTarget } from "@sap/cf-tools";
let cfView: CFView;

export type CFTreeChildNode = CFMessageNode | CFService | CFApplication | CFFolder | CFTargetTI;
export class CFTargetTI extends vscode.TreeItem {
  public contextValue = `cf-target${
    _.includes(this.target.label, "(no targets)") ? "-notargets" : this.target.isCurrent ? "-active" : ""
  }`;

  constructor(public readonly target: CFTarget) {
    super(
      target.label,
      target.isCurrent ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.Collapsed
    );
    this.tooltip = target.label;
    this.iconPath = {
      light: path.join(__dirname, "..", "resources", "light", `target${this.target.isCurrent ? "-a" : ""}.svg`),
      dark: path.join(__dirname, "..", "resources", "dark", `target${this.target.isCurrent ? "-a" : ""}.svg`),
    };
  }

  // https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-0.html#properties-overriding-accessors-and-vice-versa-is-an-error
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  get description(): string {
    return `${_.includes(this.contextValue, "-active") ? "(Active Target)" : ""}${this.target.isDirty ? "*" : ""}`;
  }
}

export class CFMessageNode extends vscode.TreeItem {
  public iconPath = {
    light: path.join(__dirname, "..", "resources", "light", "info.svg"),
    dark: path.join(__dirname, "..", "resources", "dark", "info.svg"),
  };
  constructor(label: string, public readonly parent: CFFolder) {
    super(label, vscode.TreeItemCollapsibleState.None);
  }
}

export class CFLoginNode extends CFMessageNode {
  public contextValue = "cf-login-required";
  constructor(parent: CFFolder) {
    super(`Login required`, parent);
    this.tooltip = `Log in to see details`;
  }
}

export class CFTargetNotCurrent extends CFMessageNode {
  public contextValue = "cf-target-not-current";

  constructor(parent: CFFolder, targetName?: string) {
    super(`Target needs to be active`, parent);
    this.tooltip = `Set the '${targetName}' as the active target to see details.`;
  }
}

export class CFService extends vscode.TreeItem {
  public iconPath = vscode.ThemeIcon.File;
  public contextValue = "cf-service";

  constructor(public readonly label: string, public readonly type: string, public readonly parent: CFFolder) {
    super(label, vscode.TreeItemCollapsibleState.None);
  }
}

export class CFApplication extends vscode.TreeItem {
  public iconPath = vscode.ThemeIcon.File;
  public contextValue = "cf-application";

  constructor(public readonly label: string, public readonly state: string, public readonly parent: CFFolder) {
    super(label, vscode.TreeItemCollapsibleState.None);
  }
}

export class CFFolder extends vscode.TreeItem {
  public iconPath = vscode.ThemeIcon.Folder;

  constructor(public readonly label: string, public readonly parent: CFTargetTI) {
    super(label, vscode.TreeItemCollapsibleState.Collapsed);
    this.tooltip = `${label}`;
  }
}

export class CFServicesFolder extends CFFolder {
  constructor(public readonly label: string, parent: CFTargetTI) {
    super(label, parent);
    this.contextValue = `services${parent.target.isCurrent ? "-active" : ""}`;
  }
}

export class CFAppsFolder extends CFFolder {
  constructor(public readonly label: string, parent: CFTargetTI) {
    super(label, parent);
    this.contextValue = `apps${parent.target.isCurrent ? "-active" : ""}`;
  }
}

export class CFView implements vscode.TreeDataProvider<vscode.TreeItem> {
  public static get(): CFView {
    return cfView;
  }

  public readonly privateOnDidChangeTreeData: vscode.EventEmitter<
    vscode.TreeItem | undefined
  > = new vscode.EventEmitter<vscode.TreeItem | undefined>();
  public readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined> = this.privateOnDidChangeTreeData
    .event;
  public targets?: CFTargetTI[];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(context: vscode.ExtensionContext, configFilePath: string) {
    // this.subscribeOnFileEventsAndRefresh(context, configFilePath);
    this.refresh();
    cfView = this;
  }

  public refresh(): void {
    this.privateOnDidChangeTreeData.fire(undefined);
  }

  public getParent(element: vscode.TreeItem): vscode.ProviderResult<vscode.TreeItem> {
    return _.get(element, "parent") as vscode.TreeItem;
  }

  public getTreeItem(element: vscode.TreeItem): Promise<vscode.TreeItem> {
    if (/^cf-(service|application)$/.test(element.contextValue || "")) {
      const item = _.cloneDeep(element);
      item.label =
        element.contextValue === "cf-application"
          ? `${element.label?.toString()} (${(element as CFApplication).state})`
          : `${element.label?.toString()} (${(element as CFService).type})`;
      return Promise.resolve(item);
    }
    return Promise.resolve(element);
  }

  public async getChildren(parent: vscode.TreeItem): Promise<vscode.TreeItem[]> {
    if (parent) {
      if (parent instanceof CFTargetTI) {
        return [new CFServicesFolder("Services", parent), new CFAppsFolder("Applications", parent)];
      } else if (/^(services|apps)/.test(parent.contextValue || "")) {
        if (/-active$/.test(parent.contextValue || "")) {
          try {
            return parent instanceof CFAppsFolder
              ? /* eslint-disable-next-line @typescript-eslint/no-unsafe-argument */
                _.map(await cfGetApps(), (app) => new CFApplication(app.name, _.get(app, "state"), parent))
              : _.map(
                  await cfGetServiceInstancesList(),
                  (service) => new CFService(service.label, service.serviceName, parent as CFFolder)
                );
          } catch (e) {
            return [new CFLoginNode(parent as CFFolder)];
          }
        } else {
          /* eslint-disable-next-line @typescript-eslint/no-unsafe-argument */
          return [new CFTargetNotCurrent(parent as CFFolder, _.get(parent, "parent.target.label"))];
        }
      }
      return [];
    }
    // return list of targets
    this.targets = _.map(await cfGetTargets(), (target) => new CFTargetTI(target));
    return this.targets;
  }

  public getCurrentTarget(): CFTarget | undefined {
    return _.get(_.find(this.targets, "target.isCurrent"), "target");
  }

  public getTargets(): CFTargetTI[] | undefined {
    return this.targets;
  }

  // keep temporary as a reference for future usage
  // private subscribeOnFileEventsAndRefresh(context: vscode.ExtensionContext, configFilePath: string) {
  // 	if (_.size(configFilePath) > 0) {
  // 		const fsw = vscode.workspace.createFileSystemWatcher(configFilePath);
  // 		context.subscriptions.push(fsw.onDidChange(() => this.refresh()));
  // 		context.subscriptions.push(fsw.onDidCreate(() => this.refresh()));
  // 		context.subscriptions.push(fsw.onDidDelete(() => this.refresh()));
  // 	}
  // }
}

export function getTargetRoot(node: CFTreeChildNode | undefined): CFTargetTI {
  let item = node;
  while (_.get(item, "parent")) {
    item = _.get(item, "parent") as CFTreeChildNode; // walk up until target folder found
  }
  return item as CFTargetTI;
}
