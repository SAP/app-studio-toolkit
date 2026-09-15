import { isFunction } from "lodash";
import { ConfiguredTask } from "@sap_oss/task_contrib_types";
import { AppEvents } from "./app-events";
import { AnalyticsWrapper } from "./usage-report/usage-analytics-wrapper";
import { getLogger } from "./logger/logger-wrapper";
import { messages } from "./i18n/messages";
import { exceptionToString, getUniqueTaskLabel, serializeTask } from "./utils/task-serializer";
import { commands, window } from "vscode";
import { createTaskEditorPanel } from "./panels/panels-handler";
import { multiStepTaskSelect } from "./multi-step-select";
import { ElementTreeItem } from "./view/task-tree-item";
import { completeDeployConfig, isDeploymentConfigTask } from "./misc/common-e2e-config";

export class TasksSelection {
  constructor(
    private readonly appEvents: AppEvents,
    private readonly tasks: ConfiguredTask[],
    private readonly readResource: (file: string) => Promise<string>,
  ) {}

  public async select(treeItem?: ElementTreeItem): Promise<any> {
    try {
      const { task } = await multiStepTaskSelect(this.tasks, treeItem);
      if (task) {
        // report telemetry event
        AnalyticsWrapper.reportTaskCreateSelected(task);
        await (isDeploymentConfigTask(task) ? completeDeployConfig(task) : this.setSelectedTask(task));
        // report telemetry event
        AnalyticsWrapper.reportTaskCreateFinished(task);
      }
    } catch (e: any) {
      getLogger().debug(`Task selection failed: ${exceptionToString(e)}`);
      window.showErrorMessage(exceptionToString(e));
    }
  }
  private async setSelectedTask(selectedTask: ConfiguredTask): Promise<void> {
    selectedTask.label = getUniqueTaskLabel(selectedTask.label);

    const newTask = { ...selectedTask };
    delete selectedTask.__wsFolder;
    delete selectedTask.__image;
    delete selectedTask.__intent;
    delete selectedTask.__extensionName;

    // hack: allow task definitions to be configured before they are serialized
    const contributor = this.appEvents.getTasksEditorContributor(selectedTask.type);
    if (isFunction(contributor?.onSave)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- confirmed by previous line
      await contributor!.onSave(selectedTask);
    }

    const index = await this.appEvents.addTaskToConfiguration(newTask.__wsFolder, selectedTask);
    getLogger().debug(messages.CREATE_TASK(serializeTask(selectedTask)));

    newTask.__index = index;
    await createTaskEditorPanel(newTask, this.readResource);
    void commands.executeCommand("tasks-explorer.tree.select", selectedTask);
  }
}
