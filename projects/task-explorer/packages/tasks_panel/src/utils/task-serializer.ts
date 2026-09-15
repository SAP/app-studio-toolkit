import { ConfiguredTask } from "@sap_oss/task_contrib_types";
import escapeStringRegexp = require("escape-string-regexp");
import { filter, map } from "lodash";
import { getConfiguredTasksFromCache } from "../../src/services/tasks-provider";
import { ConfigurationTarget, TaskDefinition, Uri, languages, workspace } from "vscode";

export function serializeTask(task: ConfiguredTask): string {
  return JSON.stringify(task);
}

export function getUniqueTaskLabel(label: string): string {
  const existingLabels = map(getConfiguredTasksFromCache(), "label");
  // tasks created from auto detected tasks templates multiple times
  // will receive name: "<task_name> (<index>)"
  // where index is the next free number, starting from 2
  const fixedTaskLabel = escapeStringRegexp(label);
  const taskRegex = new RegExp(`^${fixedTaskLabel}( [(](\\d)*[)])$`);
  let index = 0;
  const similarTasks = filter(existingLabels, (_) => taskRegex.test(_));
  if (similarTasks.length > 0) {
    const similarTasksIndexes: number[] = map(similarTasks, (_) => {
      const matchArr = taskRegex.exec(_);
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO: verify
      return Number(matchArr![1].replace("(", "").replace(")", ""));
    });
    index = Math.max(...similarTasksIndexes) + 1;
  } else if (existingLabels.find((_) => _ === label)) {
    // identical match
    index = 2;
  }
  const taskSuffix = index === 0 ? "" : ` (${index})`;
  return label + taskSuffix;
}

export async function updateTasksConfiguration(
  folder: string,
  tasks: (ConfiguredTask | TaskDefinition)[],
): Promise<void> {
  const url = Uri.file(folder);
  // register on diagnostic notifications for this flow only
  const handler = languages.onDidChangeDiagnostics((e) => {
    const tasksPath = Uri.joinPath(url, ".vscode", "tasks.json");
    if (e.uris.map((v) => v.path).includes(tasksPath.path)) {
      // temporary disabled - TODO: enable when we have a way to detect an actual problems a more arrurately
      // const BTN_PROBLEMS = "Show problems";
      // void window
      //   .showWarningMessage(`There are tasks definitions errors. See the problems for details.`, BTN_PROBLEMS)
      //   .then(async (answer: string | undefined) => {
      //     if (answer === BTN_PROBLEMS) {
      //       await window.showTextDocument(tasksPath);
      //       await commands.executeCommand("workbench.actions.view.problems");
      //     }
      //   });
    }
  });

  const tasksConfig = workspace.getConfiguration("tasks", url);
  await tasksConfig.update("tasks", tasks, ConfigurationTarget.WorkspaceFolder);

  setTimeout(() => {
    handler.dispose(); // unregister for diagnostic notifications after flow finished
  }, 1000);
}

export function exceptionToString(e: any) {
  return e?.toString?.() ?? "unknown error";
}
