export const messages = {
  LOGGER_NOT_AVAILABLE: (): string => `Logs are not available for the Task Explorer extension.`,
  TASK_UPDATE_FAILED: (): string =>
    `Could not update the task because the configuration file has been altered. Create a new task instead.`,
  TASK_DELETE_FAILED: (): string => `Could not delete the task because the configuration file has been altered.`,
  DISCARD_CHANGES_BUTTON_TEXT: (): string => `Discard Changes`,
  MISSING_EXECUTION_TASK: (): string => `The Execution task is missing.`,
  MISSING_AUTO_DETECTED_TASKS: (): string =>
    `There are currently no tasks that are relevant for your workspace content.`,
  CONFIG_CHANGED: (): string => `The configuration has been changed.`,
  GET_TREE_BRANCHES: (name: string, intents: number): string => `Retrieved ${intents} ${name}.`,
  GET_TREE_CHILDREN_BY_INTENT: (intent: string, tasks: number): string =>
    `${tasks} tasks retrieved for the ${intent} intent.`,
  ACTIVATE_CONTRIB_EXT_ERROR: (extensionId: string): string => `Could not activate the ${extensionId} extension.`,
  SWITCH_UNSAVED_TASK: (taskInProcess: string): string =>
    `You have unsaved changes in the "${taskInProcess}" task. \n` +
    `The changes will be discarded. \n` +
    `Click "Close" to return to the "${taskInProcess}" task or "Discard Changes" to continue.`,
  DELETE_TASK: (task: string): string => `The ${task} task has been deleted.`,
  EDIT_TASK: (task: string): string => `The changes to the ${task} task have been saved.`,
  TASK_NOT_FOUND: (task: string): string => `Could not find the ${task} task.`,
  EXECUTE_TASK: (task: string): string => `Executed the ${task} task.`,
  TERMINATE_TASK: (task: string): string => `Terminate the ${task} task.`,
  CREATE_TASK: (task: string): string => `Create the ${task} task.`,
  MISSING_TYPE: (type: string): string => `The "${type}" type is missing.`,
  DUPLICATED_TYPE: (type: string): string => `The "${type}" type has already been contributed.`,
  EXECUTE_FAILURE: (task: string): string => `Could not execute the "${task}"`,
  TERMINATE_FAILURE: (task: string, reason: string): string => `Could not terminate the ${task} task. ${reason}`,
  EVALUATED_METHOD_FAILURE: (methodName: string, questionName: string, params: string, err: Error): string =>
    `The call to the "${methodName}" method of the "${questionName}" property containing the ${params} parameters, failed with error: ${err}`,
  METHOD_NOT_FOUND: (methodName: string, questionName: string, params: string): string =>
    `Could not find the "${methodName}" method for the "${questionName}" question in the ${params} task parameter.`,
  GET_IMAGE_FAILURE: (imagePath: string, err: Error): string =>
    `Could not get the image from the given path: "${imagePath}". Failed with error: ${err}`,
  LABEL_IS_NOT_UNIQUE: (): string => `Enter a unique value.`,
  MANDATORY_FIELD: (): string => `Mandatory field`,
  OPENING_SELECTION_VIEW: `Collecting the tasks...`,
  delete_task_confirmation: (name: string) => `Are you sure you want to delete the '${name}' configuration?`,
  resource_open_could_not_open_editor: "Could not open the editor for the required resource",
  configuration_task_not_found: (label: string) => `Could not find the "${label}" configuration.`,
  create_task_pick_project_placeholder: "Select the project for which you want to create the task:",
  create_task_pick_task_placeholder: "Select the task you want to perform:",
  err_task_definition_unsupported_target: "Unable to complete the tasks definition - unsupported deployment target",
};
