import {
  ConfiguredTask,
  TaskEditorContributionAPI,
} from "@sap_oss/task_contrib_types";

/**
 * Interface AppEvents
 * Handles all activities requested from Task Editor and Create Task views
 */
export interface AppEvents {
  /** Execute task
   * @param task
   */
  executeTask(task: any): Promise<void>;

  /** Update task in the tasks.json configuration
   * @param path - Path to the workspace folder with corresponding tasks.json file
   * @param task - updated task
   * @param index - position of the task in the list of the tasks.json file
   */
  updateTaskInConfiguration(
    path: string,
    task: ConfiguredTask,
    index: number
  ): Promise<void>;

  /** Create task in the tasks.json configuration
   * @param path - Path to the workspace folder with corresponding tasks.json file
   * @param task - task to be created
   * @return position of the created task in the tasks.json file
   */
  addTaskToConfiguration(path: string, task: ConfiguredTask): Promise<number>;

  /** Get Editor Contributor of specific type of the tasks
   * @param path - Path to the workspace folder with corresponding tasks.json file
   * @param task - task to be created
   * @return API of Task Editor Contributor
   */
  getTasksEditorContributor(
    type: string
  ): TaskEditorContributionAPI<ConfiguredTask> | undefined;

  getTaskPropertyDescription(type: string, property: string): string;
}
