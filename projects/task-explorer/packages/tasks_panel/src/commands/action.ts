import {
  workspace,
  window,
  QuickPickItem,
  commands,
  TreeItemCollapsibleState,
  Task,
  QuickPickItemKind,
  tasks,
  TaskStartEvent,
  Disposable,
  ExtensionContext,
  TaskDefinition,
  WorkspaceFolder,
  TaskScope,
} from "vscode";
import { debounce, find, isMatch, matches, reduce, size } from "lodash";
import { ITasksProvider } from "../services/definitions";
import { IntentTreeItem, ProjectTreeItem } from "../view/task-tree-item";
import { TasksTree } from "../view/tasks-tree";
import { ConfiguredTask } from "@sap_oss/task_contrib_types";
import { getLogger } from "../logger/logger-wrapper";
import { isMatchBuild, isMatchDeploy } from "../utils/ws-folder";
import { exceptionToString } from "../utils/task-serializer";

export type ActionKind = "build" | "deploy";
const CREATE_TASK = "Create Task...";
const LAST_TASK_STATE = "lastTaskState";
let lastPickedItem: QuickPickItem | undefined;
interface TaskData {
  name: string;
  definition: TaskDefinition;
  scope: WorkspaceFolder | TaskScope | undefined;
}

export function subscribeTaskRun(context: ExtensionContext): Disposable {
  function isDeployTask(task: Task): boolean {
    return isMatchDeploy(task.definition.type) || isMatchDeploy(task.name);
  }
  function isBuildTask(task: Task): boolean {
    return isMatchBuild(task.definition.type) || isMatchBuild(task.name);
  }
  // keep last run task data persistant between sessions
  return tasks.onDidStartTask(async (e: TaskStartEvent) => {
    const { task } = e.execution;
    const lastRunTask: { build: TaskData | undefined; deploy: TaskData | undefined } = context.workspaceState.get(
      LAST_TASK_STATE,
    ) ?? { build: undefined, deploy: undefined };
    const runTask = { ...lastRunTask };
    const taskData = { name: task.name, definition: task.definition, scope: task.scope };
    if (isDeployTask(task)) {
      runTask.deploy = taskData;
    } else if (isBuildTask(task)) {
      runTask.build = taskData;
    }
    // update only if changed
    if (!isMatch(lastRunTask, runTask)) {
      try {
        await context.workspaceState.update(LAST_TASK_STATE, runTask);
      } catch (err) {
        getLogger().warn(`Failed to update last debug session data`, { reason: exceptionToString(err) });
      }
    }
  });
}

// debounce should prevent running multiple instances at once
export const runAction = debounce(
  async (
    kind: ActionKind,
    dataProvider: TasksTree,
    taskProvider: ITasksProvider,
    context: ExtensionContext,
  ): Promise<void> => {
    function getLastRunTaskData(kind: ActionKind): TaskData | undefined {
      const lastRunTaskState: any = context.workspaceState.get(LAST_TASK_STATE);
      return lastRunTaskState?.[kind];
    }
    async function executeCreateTaskCommand(): Promise<void> {
      return commands.executeCommand(
        "tasks-explorer.createTask",
        new IntentTreeItem(kind, TreeItemCollapsibleState.Collapsed, new ProjectTreeItem("", "")),
      );
    }

    function collectItems(tasks: ConfiguredTask[]): QuickPickItem[] {
      const lastRun = getLastRunTaskData(kind);
      let lastRunItem: ConfiguredTask | undefined;
      const items = reduce(
        tasks,
        (result: QuickPickItem[], task: ConfiguredTask) => {
          if (lastRun?.name === task.label && lastRun.definition.type === task.type) {
            lastRunItem = task;
          } else {
            result.push({ ...task, ...{ description: task.type }, ...{ detail: task.__wsFolder } });
          }
          return result;
        },
        [],
      );
      items.push({ kind: QuickPickItemKind.Separator, label: "configure" }, { label: CREATE_TASK });

      if (lastRunItem) {
        // pushing the last run item to top of the list (vscode not providing another way to select default item..)
        items.unshift(
          { kind: QuickPickItemKind.Separator, label: "Last Run" },
          { ...lastRunItem, ...{ description: lastRunItem.type }, ...{ detail: lastRunItem.__wsFolder } },
          { kind: QuickPickItemKind.Separator, label: "" },
        );
      }
      return items;
    }

    async function showQuickPick(tasks: ConfiguredTask[]): Promise<void> {
      const identifyConfiguredTaskByPickedItem = (item: QuickPickItem): ConfiguredTask | undefined => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars -- object destructuring is used to exclude the specified properties
        const { ["description"]: excludedDescription, ["detail"]: excludedDetails, ...task } = item;
        return find(tasks, matches(task));
      };

      lastPickedItem = await window.showQuickPick(collectItems(tasks), {
        placeHolder: "What would you like to run?",
        ignoreFocusOut: true,
        matchOnDescription: true,
        matchOnDetail: true,
      });

      if (lastPickedItem?.["type"]) {
        const configuredTask = identifyConfiguredTaskByPickedItem(lastPickedItem);
        if (configuredTask) {
          return runTask(configuredTask);
        }
      } else if (lastPickedItem?.label === CREATE_TASK) {
        return executeCreateTaskCommand();
      }
    }

    async function runTask(task: ConfiguredTask): Promise<void> {
      const taskItem = await dataProvider.findTreeItem(task);
      if (taskItem) {
        void commands.executeCommand("tasks-explorer.tree.select", task);
        await commands.executeCommand("tasks-explorer.executeTask", taskItem);
      } else {
        getLogger().error(`Internal: task not found in the tree data structure`, {
          label: task.label,
          type: task.type,
        });
      }
    }

    // if no open workspace - show warning
    if (!workspace.workspaceFolders?.length) {
      throw new Error(`You have no open projects. Open the project you want to ${kind.toString()} and try again.`);
    }

    const allTasks = await taskProvider.getConfiguredTasks();
    const matcher = kind === "build" ? isMatchBuild : isMatchDeploy;
    const tasks = allTasks.filter((task) => matcher(task.__intent));
    // should show quick pick only for the first time in a session
    if (!lastPickedItem) {
      if (!tasks.length) {
        // tasks not found -> query for task creation with specified intent/group
        return executeCreateTaskCommand();
      } else if (size(tasks) === 1 && size(workspace.workspaceFolders) === 1) {
        return runTask(tasks[0]);
      }
      return showQuickPick(tasks);
    } else {
      if ((<any>lastPickedItem).type) {
        // specific task selected (not `Create Task...`)
        const lastRun = getLastRunTaskData(kind);
        if (lastRun) {
          const found = find(tasks, (task) => {
            return task.label === lastRun.name && task.type === lastRun.definition.type;
          });
          if (found) {
            return runTask(found);
          }
        }
      }
      // fallback in cases:
      // 1. didn't find last run task
      // 2. selected quick pick item - `Create Task...`
      return showQuickPick(tasks);
    }
  },
  500,
);
