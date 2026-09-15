import { ProgressLocation, window } from "vscode";
import { ITasksProvider } from "../services/definitions";
import { messages } from "../i18n/messages";
import {
  createTasksSelection,
  disposeTaskEditorPanel,
  getTaskEditorPanel,
  getTaskInProcess,
} from "../panels/panels-handler";
import { ElementTreeItem } from "../view/task-tree-item";
import { isEmpty } from "lodash";
import { AnalyticsWrapper } from "../usage-report/usage-analytics-wrapper";

export async function createTask(
  tasksProvider: ITasksProvider,
  readResource: (file: string) => Promise<string>,
  treeItem?: ElementTreeItem,
): Promise<void> {
  // report telemetry event
  AnalyticsWrapper.reportTaskCreate(treeItem as any);

  const taskInProcess = getTaskInProcess();

  if (taskInProcess !== undefined) {
    const decision = await window.showInformationMessage(
      messages.SWITCH_UNSAVED_TASK(taskInProcess),
      { modal: true },
      messages.DISCARD_CHANGES_BUTTON_TEXT(),
    );
    if (decision === messages.DISCARD_CHANGES_BUTTON_TEXT()) {
      disposeTaskEditorPanel();
    } else {
      return;
    }
  } else {
    const taskEditorPanel = getTaskEditorPanel();
    if (taskEditorPanel !== undefined) {
      disposeTaskEditorPanel();
    }
  }

  // display progress, it might take a while
  return window.withProgress(
    {
      location: ProgressLocation.Notification,
      title: messages.OPENING_SELECTION_VIEW,
    },
    () => openViewForAutoDetectedTaskSelection(tasksProvider, readResource, treeItem),
  );
}

async function openViewForAutoDetectedTaskSelection(
  tasksProvider: ITasksProvider,
  readResource: (file: string) => Promise<string>,
  treeItem?: ElementTreeItem,
): Promise<void> {
  return tasksProvider.getAutoDectedTasks().then((tasks) => {
    if (isEmpty(tasks)) {
      throw new Error(messages.MISSING_AUTO_DETECTED_TASKS());
    }
    void createTasksSelection(tasks, readResource, treeItem);
  });
}
