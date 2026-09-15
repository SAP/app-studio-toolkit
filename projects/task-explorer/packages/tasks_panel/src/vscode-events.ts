import { Uri, workspace, window, WebviewPanel } from "vscode";
import { ConfiguredTask, TaskEditorContributionAPI } from "@sap_oss/task_contrib_types";

import { AppEvents } from "./app-events";
import { Contributors } from "./services/contributors";
import { IContributors } from "./services/definitions";
import { executeVScodeTask } from "./services/tasks-executor";
import { getLogger } from "./logger/logger-wrapper";
import { messages } from "./i18n/messages";
import { cleanTasks } from "./utils/ws-folder";
import { updateTasksConfiguration } from "./utils/task-serializer";

export class VSCodeEvents implements AppEvents {
  private readonly contributors: IContributors;

  constructor(private webviewPanel?: WebviewPanel) {
    this.contributors = Contributors.getInstance();
  }

  async executeTask(task: ConfiguredTask): Promise<void> {
    return executeVScodeTask(task);
  }

  async updateTaskInConfiguration(path: string, task: ConfiguredTask, index: number): Promise<void> {
    const tasksConfig = workspace.getConfiguration("tasks", Uri.file(path));
    const tasks: ConfiguredTask[] = tasksConfig.get("tasks") ?? [];
    if (tasks.length > index) {
      tasks[index] = task;
      cleanTasks(tasks);
      await updateTasksConfiguration(path, tasks);
    } else {
      getLogger().error(messages.TASK_UPDATE_FAILED(), { taskIndex: index, length: tasks.length });
      window.showErrorMessage(messages.TASK_UPDATE_FAILED());
      return;
    }
    // `this.webviewPanel` property is optionaly since it is not required for `addTaskToConfiguration` flow
    if (this.webviewPanel) {
      // change tab name on save
      this.webviewPanel.title = task.label;
    }
  }

  getTasksEditorContributor(type: string): TaskEditorContributionAPI<ConfiguredTask> {
    return this.contributors.getTaskEditorContributor(type);
  }

  async addTaskToConfiguration(path: string, task: ConfiguredTask): Promise<number> {
    const tasksConfig = workspace.getConfiguration("tasks", Uri.file(path));
    let configuredTasks: ConfiguredTask[] = tasksConfig.get("tasks") ?? [];
    configuredTasks = configuredTasks.concat(task);
    cleanTasks(configuredTasks);

    await updateTasksConfiguration(path, configuredTasks);

    return configuredTasks.length - 1;
  }

  getTaskPropertyDescription(type: string, property: string): string {
    return this.contributors.getTaskPropertyDescription(type, property);
  }
}
