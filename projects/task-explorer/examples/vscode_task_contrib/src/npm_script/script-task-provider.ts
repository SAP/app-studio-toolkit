import { dirname } from "path";
import { ShellExecution, Task, TaskProvider, TaskScope, Uri, workspace, WorkspaceFolder } from "vscode";
import { getTaskSources } from "../utils/task-source-provider";
import { NPM_SCRIPT_TASK_TYPE, NPM_SCRIPT_TYPE, NPMScriptDefinitionType } from "./script-definitions";
import { getWorkspaceFolderByPath } from "../utils/utils";

// Script Task Provider
// This Task Provider detects all package.json files in workspace folders
// and creates auto detected tasks accordingly.
// The purpose of the tasks is to enable the user to
// execute one of the scripts defined in the package.json file.
// The tasks have to be configured in the Tasks Explorer.
// User will have to select script for execution and (optionally)
// add some flag(s) relevant for the script
export class ScriptTaskProvider implements TaskProvider {
  // auto detection of tasks
  async provideTasks(): Promise<Task[]> {
    let npmTasks: Task[] = [];
    const wsFolderSources = await getTaskSources("**/package.json");
    for (const wsFolderPath in wsFolderSources) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- TODO: verify
      const wsFolder: WorkspaceFolder = workspace.getWorkspaceFolder(Uri.file(wsFolderPath))!;
      for (const packageJsonPath of wsFolderSources[wsFolderPath]) {
        const taskDefinition = this.createTaskDefinition(packageJsonPath);
        const task = new Task(
          taskDefinition,
          wsFolder,
          taskDefinition.label,
          NPM_SCRIPT_TYPE,
          new ShellExecution("sleep 2; echo template only", {
            cwd: wsFolder.uri.path,
          }),
        );
        npmTasks = npmTasks.concat(task);
      }
    }
    return npmTasks;
  }

  // execution of configured task
  resolveTask(npmTask: Task): Task | undefined {
    if (npmTask.definition.type !== NPM_SCRIPT_TYPE) {
      return undefined;
    }
    const wsFolder = getWorkspaceFolderByPath(npmTask.definition.packageJSONPath);
    if (wsFolder === undefined) {
      return undefined;
    }
    const taskExecution = new ShellExecution(
      `npm run ${npmTask.definition.script} ${npmTask.definition.arguments}; sleep 2;`,
      {
        cwd: dirname(npmTask.definition.packageJSONPath),
      },
    );
    return new Task(
      npmTask.definition,
      npmTask.scope ?? TaskScope.Workspace,
      npmTask.name,
      NPM_SCRIPT_TYPE,
      taskExecution,
    );
  }

  private createTaskDefinition(packageJson: string): NPMScriptDefinitionType {
    return {
      type: NPM_SCRIPT_TYPE,
      taskType: NPM_SCRIPT_TASK_TYPE,
      label: `Template: run script: ${packageJson}`,
      packageJSONPath: packageJson,
      script: "",
      arguments: "",
    };
  }
}
