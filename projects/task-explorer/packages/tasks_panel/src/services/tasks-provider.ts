import { cloneDeep, compact, each, filter, isEmpty, map, set } from "lodash";
import { commands, Task, tasks, TaskScope, workspace, WorkspaceFolder } from "vscode";
import { ConfiguredTask } from "@sap_oss/task_contrib_types";
import { IContributors, ITasksEventHandler, ITasksProvider } from "./definitions";
import { BUILD, DEPLOY, MISC, isMatchBuild, isMatchDeploy } from "../../src/utils/ws-folder";

let configuredTasksCache: ConfiguredTask[];

export class TasksProvider implements ITasksProvider, ITasksEventHandler {
  private readonly eventHandlers: ITasksEventHandler[] = [];

  constructor(private readonly taskTypesProvider: IContributors) {
    this.taskTypesProvider.registerEventHandler(this);
  }

  public registerEventHandler(eventHandler: ITasksEventHandler): void {
    this.eventHandlers.push(eventHandler);
  }

  public async onChange(): Promise<void> {
    for (const eventHandler of this.eventHandlers) {
      await eventHandler.onChange();
    }
  }

  public async getConfiguredTasks(): Promise<ConfiguredTask[]> {
    const getTaskIntent = (task: ConfiguredTask): string => {
      // support to 'npm' task: reassign task.__intent according to the task.script name/purpose
      return task.type === "npm" ? asignNpmTaskType(task.script) : this.taskTypesProvider.getIntentByType(task.type);
    };

    let result: ConfiguredTask[] = [];
    if (workspace.workspaceFolders !== undefined) {
      const supportedTypes = this.taskTypesProvider.getSupportedTypes();
      for (const wsFolder of workspace.workspaceFolders) {
        const wsFolderPath = wsFolder.uri.path;
        const configuration = workspace.getConfiguration("tasks", wsFolder.uri);
        const configuredTasks: ConfiguredTask[] | undefined = configuration.get("tasks");

        if (configuredTasks === undefined) {
          continue;
        }

        const configuredContributedTasks = cloneDeep(configuredTasks);
        // indexing all existing tasks, but not supported ones, just to provide consistent behavior
        // for managing a specific task by index when editing/deleting
        each(configuredContributedTasks, (task, i) => set(task, "__index", i));
        const extendedConfiguredTasks = filter(configuredContributedTasks, (_) => supportedTypes.includes(_.type));

        for (const task of extendedConfiguredTasks) {
          task.__wsFolder = wsFolderPath;
          task.__intent = getTaskIntent(task);
          task.__extensionName = this.taskTypesProvider.getExtensionNameByType(task.type);
        }

        result = result.concat(extendedConfiguredTasks);
      }
    }
    configuredTasksCache = result;
    commands.executeCommand("setContext", "ext.isNoTasksFound", isEmpty(result));
    return result;
  }

  async getAutoDectedTasks(): Promise<ConfiguredTask[]> {
    const allTasks = await tasks.fetchTasks();

    const supportedTypes = this.taskTypesProvider.getSupportedTypes();

    const allContributedTasks: Task[] = filter(allTasks, (_) => this.isTaskAutodetected(_, supportedTypes));

    return compact(map(allContributedTasks, (_) => this.convertTaskToConfiguredTask(_, supportedTypes)));
  }

  isTaskAutodetected(task: Task, supportedTypes: string[]): boolean {
    if (supportedTypes.includes(task.definition.type)) {
      // we are in VSCode and type of task is contributed to tasks explorer
      // in this case if it came from configuration source !== taskType
      // are in BAS and task came from configuration and source != taskType as well
      return task.source === task.definition.type;
    } else {
      // task is not supported or we are in BAS, it's supported and definitely not configured
      return supportedTypes.includes(task.definition.taskType);
    }
  }

  private static getTaskWorkspaceFolder(task: Task): string | undefined {
    // According to VSCode API tasks's scope can be: TaskScope.Global | TaskScope.Workspace | WorkspaceFolder
    // currently we support only WorkspaceFolder
    // in future we have to examine if we need to support another cases
    return instanceOfWorkspaceFolder(task.scope) ? task.scope.uri.path : undefined;
  }

  convertTaskToConfiguredTask(task: Task, supportedTypes: string[]): ConfiguredTask | undefined {
    if (supportedTypes.includes(task.definition.type)) {
      task = patchNpmTasks(task);
      return {
        ...task.definition,
        label: task.name,
        __wsFolder: TasksProvider.getTaskWorkspaceFolder(task),
        __intent: task.definition.taskType,
        __extensionName: this.taskTypesProvider.getExtensionNameByType(task.definition.type),
      };
    }
  }
}

function instanceOfWorkspaceFolder(object: undefined | TaskScope | WorkspaceFolder): object is WorkspaceFolder {
  return object !== undefined && object !== TaskScope.Global && object !== TaskScope.Workspace;
}

export function getConfiguredTasksFromCache(): ConfiguredTask[] {
  return cloneDeep(configuredTasksCache);
}

function patchNpmTasks(task: Task): Task {
  // support to `npm` task: assign task.taskType according to the task.script name/purpose
  if (task.definition.type === "npm" && !task.definition.taskType) {
    task.definition.taskType = asignNpmTaskType(task.definition.script);
  }
  return task;
}

// `npm` task support
function asignNpmTaskType(script: string): string {
  if (isMatchDeploy(script)) {
    return DEPLOY;
  } else if (isMatchBuild(script)) {
    return BUILD;
  } else {
    return MISC;
  }
}
