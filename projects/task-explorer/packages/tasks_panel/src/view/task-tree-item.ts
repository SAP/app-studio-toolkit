import { find } from "lodash";
import { TreeItem, TreeItemCollapsibleState, Command, tasks, ThemeIcon } from "vscode";
import { isMatchBuild, isMatchDeploy } from "../../src/utils/ws-folder";

type TaskStatus = "idle" | "running";
export type ElementTreeItem = ProjectTreeItem | IntentTreeItem | TaskTreeItem;

class TreeTooltiplessItem extends TreeItem {
  constructor(label: string, collapsibleState: TreeItemCollapsibleState) {
    super(label, collapsibleState);
    this.tooltip = "";
  }
}

class BranchTreeItem extends TreeTooltiplessItem {
  constructor(
    label: string,
    collapsibleState: TreeItemCollapsibleState,
    context: string,
    public readonly parent?: TreeItem,
  ) {
    super(label, collapsibleState);
    this.contextValue = context;
  }
}
class FolderTreeItem extends BranchTreeItem {
  constructor(
    label: string,
    public fqn: string,
    context: string,
    collapsibleState: TreeItemCollapsibleState,
    parent?: TreeItem,
  ) {
    super(label, collapsibleState, context, parent);
  }
}
export class RootTreeItem extends FolderTreeItem {
  constructor(
    label: string,
    fqn: string,
    collapsibleState: TreeItemCollapsibleState = TreeItemCollapsibleState.Expanded,
  ) {
    super(label, fqn, "root", collapsibleState, undefined);
    this.iconPath = new ThemeIcon("folder");
  }
}
export class ProjectTreeItem extends FolderTreeItem {
  constructor(
    label: string,
    fqn: string,
    parent?: TreeItem,
    collapsibleState: TreeItemCollapsibleState = TreeItemCollapsibleState.Expanded,
  ) {
    super(label, fqn, "project", collapsibleState, parent);
    this.iconPath = new ThemeIcon("folder");
  }
}
export class IntentTreeItem extends BranchTreeItem {
  constructor(
    label: string,
    collapsibleState: TreeItemCollapsibleState = TreeItemCollapsibleState.Expanded,
    parent?: TreeItem,
  ) {
    super(label, collapsibleState, "intent", parent);
  }
}

export class TaskTreeItem extends TreeTooltiplessItem {
  constructor(
    public index: number,
    public type: string,
    label: string,
    public wsFolder: string,
    collapsibleState: TreeItemCollapsibleState,
    public readonly parent: TreeItem,
    command?: Command,
  ) {
    super(label, collapsibleState);
    this.command = command;
    const task = this.command?.arguments?.[0];
    if (task) {
      this.contextValue = `task--${getTaskStatus(task)}`;
      this.iconPath = getIcon(task.__intent);
    }
  }
}

export class EmptyTaskTreeItem extends TreeTooltiplessItem {
  constructor(public readonly parent: ProjectTreeItem) {
    super("Create a task", TreeItemCollapsibleState.None);
    this.iconPath = getIcon();
    this.command = {
      command: "tasks-explorer.createTask",
      title: "Create Task",
      arguments: [parent],
    };
  }
}

function getTaskStatus(task: any): TaskStatus {
  return find(tasks.taskExecutions, (_) => {
    return _.task.name === task.label && _.task.definition.type === task.type;
  })
    ? "running"
    : "idle";
}

function getIcon(intent?: string): ThemeIcon {
  if (!intent) {
    return new ThemeIcon("add");
  } else if (isMatchDeploy(intent)) {
    return new ThemeIcon("rocket");
  } else if (isMatchBuild(intent)) {
    return new ThemeIcon("package");
  } else {
    // misc
    return new ThemeIcon("inspect");
  }
}
