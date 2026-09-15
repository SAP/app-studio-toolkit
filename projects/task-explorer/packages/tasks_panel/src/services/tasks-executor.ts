import { commands, tasks, window } from "vscode";
import { find } from "lodash";
import { getLogger } from "../logger/logger-wrapper";
import { messages } from "../i18n/messages";
import { exceptionToString, serializeTask } from "../utils/task-serializer";

export async function executeVScodeTask(task: any): Promise<void> {
  const allTasks = await tasks.fetchTasks({ type: task.type });
  const taskForExecution = find(allTasks, ["name", task.label]);

  try {
    if (taskForExecution !== undefined) {
      const listener = tasks.onDidEndTask((e) => {
        if (e.execution.task?.name === taskForExecution.name) {
          // update the tree items context value [running -> idle]
          void commands.executeCommand("tasks-explorer.tree.refresh");
          listener.dispose();
        }
      });
      await tasks.executeTask(taskForExecution);
      // update the tree items context value [idle -> running]
      void commands.executeCommand("tasks-explorer.tree.refresh");
    } else {
      getLogger().error(messages.MISSING_EXECUTION_TASK());
    }
  } catch (error: any) {
    getLogger().error(messages.EXECUTE_FAILURE(serializeTask(task)));
    void window.showErrorMessage(error.message);
  }
}

export async function terminateVScodeTask(task: any): Promise<void> {
  try {
    const execution = find(tasks.taskExecutions, (_) => {
      return _.task.name === task.label;
    });
    if (!execution) {
      throw new Error(messages.TASK_NOT_FOUND(task.label));
    }
    execution.terminate();
  } catch (e: any) {
    throw new Error(messages.TERMINATE_FAILURE(serializeTask(task), exceptionToString(e)));
  }
}
