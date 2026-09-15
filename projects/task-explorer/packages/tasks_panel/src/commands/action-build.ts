import { ExtensionContext, window } from "vscode";
import { TasksTree } from "../view/tasks-tree";
import { ITasksProvider } from "../services/definitions";
import { runAction } from "./action";
import { exceptionToString } from "../utils/task-serializer";

export async function actionBuild(
  dataProvider: TasksTree,
  taskProvider: ITasksProvider,
  context: ExtensionContext,
): Promise<void> {
  try {
    await runAction("build", dataProvider, taskProvider, context);
  } catch (error) {
    void window.showErrorMessage(exceptionToString(error));
  }
}
