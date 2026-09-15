import { isEmpty } from "lodash";
import { terminateVScodeTask } from "../services/tasks-executor";
import { TaskTreeItem } from "../view/task-tree-item";
import { AnalyticsWrapper } from "../usage-report/usage-analytics-wrapper";
import { messages } from "../i18n/messages";
import { getLogger } from "../logger/logger-wrapper";
import { exceptionToString, serializeTask } from "../utils/task-serializer";
import { window } from "vscode";

export async function terminateTaskFromTree(treeItem: TaskTreeItem): Promise<void> {
  try {
    if (isEmpty(treeItem.command?.arguments)) {
      throw new Error("Unexpected error: command event corrupted");
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- verified in the line above
    const task = treeItem.command!.arguments![0];

    // report telemetry event
    AnalyticsWrapper.reportTaskExecuteTerminate({ ...task });

    await terminateVScodeTask(task);
    getLogger().debug(messages.TERMINATE_TASK(serializeTask(task)));
  } catch (e: any) {
    getLogger().error(exceptionToString(e));
    void window.showErrorMessage(exceptionToString(e));
  }
}
