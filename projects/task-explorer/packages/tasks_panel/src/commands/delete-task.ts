import { Uri, window, workspace } from "vscode";
import { ConfiguredTask } from "@sap_oss/task_contrib_types";
import { getLogger } from "../logger/logger-wrapper";
import { TaskTreeItem } from "../view/task-tree-item";
import { serializeTask, updateTasksConfiguration } from "../utils/task-serializer";
import { messages } from "../i18n/messages";
import { AnalyticsWrapper } from "../usage-report/usage-analytics-wrapper";
import { disposeTaskEditorPanel, getTaskEditor } from "../panels/panels-handler";
import { cleanTasks } from "../utils/ws-folder";

export async function deleteTask(treeItem: TaskTreeItem): Promise<void> {
  if (treeItem.command?.arguments === undefined) {
    return;
  }
  const task = treeItem.command.arguments[0];

  if (
    (await window.showInformationMessage(messages.delete_task_confirmation(task.label), { modal: true }, "Delete")) ===
    "Delete"
  ) {
    // report telemetry event
    AnalyticsWrapper.reportTaskDelete({ ...task });

    if (getTaskEditor()?.getTask().label === treeItem.label) {
      disposeTaskEditorPanel();
    }

    const wsFolderPath = task.__wsFolder;
    const taskIndex = task.__index;
    const tasksConfig = workspace.getConfiguration("tasks", Uri.file(wsFolderPath));
    const tasks: ConfiguredTask[] = tasksConfig.get("tasks") ?? [];
    cleanTasks(tasks);
    if (tasks.length > taskIndex) {
      tasks.splice(taskIndex, 1);
      await updateTasksConfiguration(wsFolderPath, tasks);
      getLogger().debug(messages.DELETE_TASK(serializeTask(task)));
    } else {
      getLogger().error(messages.TASK_DELETE_FAILED(), { taskIndex, legth: tasks.length });
    }
  }
}
