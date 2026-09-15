import { filter, map, uniq, sortBy, isMatch, isEmpty } from "lodash";
import { EmptyTaskTreeItem, IntentTreeItem, ProjectTreeItem, RootTreeItem, TaskTreeItem } from "./task-tree-item";
import {
  Event,
  EventEmitter,
  TreeDataProvider,
  TreeItem,
  TreeItemCollapsibleState,
  workspace,
  Uri,
  ProviderResult,
} from "vscode";
import { ITasksProvider } from "../services/definitions";
import { getClassLogger } from "../logger/logger-wrapper";
import { messages } from "../i18n/messages";
import { ConfiguredTask } from "@sap_oss/task_contrib_types";
import { collectProjects, calculateTaskWsFolder } from "../misc/e2e-config";
import { join } from "path";
import { isPathRelatedToFolder } from "../utils/ws-folder";

const LOGGER_CLASS_NAME = "Tasks Tree";

export class TasksTree implements TreeDataProvider<TreeItem> {
  private readonly _onDidChangeTreeData: EventEmitter<TaskTreeItem | null> = new EventEmitter<TaskTreeItem | null>();
  readonly onDidChangeTreeData: Event<TaskTreeItem | null> = this._onDidChangeTreeData.event;

  constructor(private readonly tasksProvider: ITasksProvider) {
    this.tasksProvider.registerEventHandler(this);
    workspace.onDidChangeConfiguration(async () => {
      getClassLogger(LOGGER_CLASS_NAME).debug(messages.CONFIG_CHANGED());
      this.onDidModify();
    });
  }

  public onDidModify(): void {
    this._onDidChangeTreeData.fire(null);
  }

  private filterByFolder(tasks: ConfiguredTask[], parent?: ProjectTreeItem): ConfiguredTask[] {
    return parent
      ? filter(tasks, (task) => {
          return isPathRelatedToFolder(calculateTaskWsFolder(task), parent.fqn ?? "undefined");
        })
      : tasks;
  }

  private getIntents(tasks: ConfiguredTask[], parent: ProjectTreeItem): IntentTreeItem[] {
    const intents = sortBy(uniq(map(this.filterByFolder(tasks, parent), "__intent")));
    getClassLogger(LOGGER_CLASS_NAME).debug(messages.GET_TREE_BRANCHES("intent", intents.length));
    return !isEmpty(intents)
      ? map(intents, (_) => new IntentTreeItem(_, TreeItemCollapsibleState.Expanded, parent))
      : [new EmptyTaskTreeItem(parent)];
  }

  private async getProjects(root: RootTreeItem): Promise<ProjectTreeItem[]> {
    const projects = filter(await collectProjects(root.fqn), (_) => !!_.project);
    getClassLogger(LOGGER_CLASS_NAME).debug(messages.GET_TREE_BRANCHES("project", projects.length));
    return map(projects, (_) => new ProjectTreeItem(_.project, join(_.wsFolder, _.project), root));
  }

  private getWorkspaces(wsFolders: string[]): RootTreeItem[] {
    getClassLogger(LOGGER_CLASS_NAME).debug(messages.GET_TREE_BRANCHES("workspace", wsFolders.length));
    return map(
      wsFolders,
      (wsFolder) =>
        new RootTreeItem(
          /* istanbul ignore next */
          workspace.getWorkspaceFolder(Uri.file(wsFolder))?.name ?? "",
          wsFolder,
        ),
    );
  }

  private getRoots(): RootTreeItem[] {
    return this.getWorkspaces(map(workspace.workspaceFolders, "uri.fsPath"));
  }

  private async getIntentChildren(tasks: ConfiguredTask[], element: TreeItem) {
    tasks = this.filterByFolder(tasks, (await this.getParent(element)) as ProjectTreeItem | undefined);
    const children = map(
      filter(tasks, ["__intent", element.label]),
      (task) =>
        new TaskTreeItem(task.__index, task.type, task.label, task.__wsFolder, TreeItemCollapsibleState.None, element, {
          command: "tasks-explorer.editTask",
          title: "Edit Task",
          arguments: [task],
        }),
    );
    /* istanbul ignore next */
    getClassLogger(LOGGER_CLASS_NAME).debug(
      messages.GET_TREE_CHILDREN_BY_INTENT(element.label?.toString() ?? "", children.length),
    );
    return children;
  }

  /* 
  expects a following structure:
  single root:
      workspace [RootTreeItem]
        - project-1 [ProjectTreeItem]
          - intent ( build, deploy, etc.) [IntentTreeItem]
            - task [TaskTreeItem]
        - project-2
          - intent ( build, deploy, etc.)
            - task

  or multiple roots:
      root-project-1 [RootTreeItem]
        - intent ( build, deploy, etc.)
          - task
      root-project-2
        - intent ( build, deploy, etc.)
          - task
  */
  public async getChildren(element?: TreeItem): Promise<TreeItem[]> {
    if (element === undefined) {
      return this.getRoots();
    } else if (element instanceof RootTreeItem) {
      const projects = await this.getProjects(element);
      return isEmpty(projects) ? this.getIntents(await this.tasksProvider.getConfiguredTasks(), element) : projects;
    } else if (element instanceof ProjectTreeItem) {
      return this.getIntents(await this.tasksProvider.getConfiguredTasks(), element);
    } else {
      return this.getIntentChildren(await this.tasksProvider.getConfiguredTasks(), element);
    }
  }

  public getTreeItem(treeItem: TaskTreeItem): TreeItem {
    return treeItem;
  }

  public async onChange(): Promise<void> {
    this.onDidModify();
  }

  public getParent(element: TreeItem): ProviderResult<TreeItem> {
    return (element as any).parent;
  }

  public async findTreeItem(task: ConfiguredTask): Promise<TreeItem | undefined> {
    const findElement = async (items: TreeItem[], task: ConfiguredTask): Promise<TreeItem | undefined> => {
      let found: TreeItem | undefined;
      for (const item of items) {
        if (item.collapsibleState !== TreeItemCollapsibleState.None) {
          found = await findElement(await this.getChildren(item), task);
        } else {
          /* istanbul ignore next */
          if (isMatch(item.command?.arguments?.[0], task)) {
            found = item;
          }
        }
        if (found) {
          return found;
        }
      }
    };
    return findElement(await this.getChildren(), task);
  }
}
