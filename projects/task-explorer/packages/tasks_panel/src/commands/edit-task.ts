import { commands, window } from "vscode";
import { ConfiguredTask } from "@sap_oss/task_contrib_types";
import { messages } from "../i18n/messages";

import { find, isMatch } from "lodash";
import { createTaskEditorPanel, getTaskEditorPanel, getTaskInProcess } from "../panels/panels-handler";
import { ITasksProvider } from "../services/definitions";
import { getLogger } from "../logger/logger-wrapper";

export async function editTreeItemTask(
  taskProvider: ITasksProvider,
  readResource: (file: string) => Promise<string>,
  task: ConfiguredTask,
): Promise<void> {
  const matchingTask = find(await taskProvider.getConfiguredTasks(), (_) => {
    return isMatch(_, task);
  });
  if (matchingTask) {
    return editTask(matchingTask, readResource);
  } else {
    getLogger().debug(`Task edit: requested task not found`, { label: task.label });
  }
}

async function editTask(task: ConfiguredTask, readResource: (file: string) => Promise<string>): Promise<void> {
  const taskInProcess = getTaskInProcess();
  if (taskInProcess === task.label) {
    return;
  }

  if (taskInProcess !== undefined) {
    const decision = await window.showInformationMessage(
      messages.SWITCH_UNSAVED_TASK(taskInProcess),
      { modal: true },
      messages.DISCARD_CHANGES_BUTTON_TEXT(),
    );
    if (decision !== messages.DISCARD_CHANGES_BUTTON_TEXT()) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- confirmed by validating of taskInProcess, which is resolved by getTaskEditorPanel()
      void commands.executeCommand("tasks-explorer.tree.select", getTaskEditorPanel()!.getLoadedTask());
      return;
    }
  }

  return createTaskEditorPanel(task, readResource);
}
