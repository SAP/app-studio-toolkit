import { ShellExecution, Task, TaskProvider, TaskScope, workspace, WorkspaceFolder } from "vscode";
import { NPM_TYPE } from "./definitions";
import { size } from "lodash";
import path = require("path");

export class NpmTaskProvider implements TaskProvider {
  async provideTasks(): Promise<Task[]> {
    return [];
  }

  // execution of configured task
  resolveTask(task: Task): Task | undefined {
    const cwd = this.resolveCwd(task);
    return new Task(
      task.definition,
      task.scope ?? TaskScope.Workspace,
      task.name,
      NPM_TYPE,
      new ShellExecution(`npm run ${task.definition.script}`, cwd ? { cwd } : undefined),
    );
  }

  private resolveCwd(task: Task): string | undefined {
    // attempt to resolve a cwd, where task will run, by the next strategy:
    // try take it from task.scope if it declared, else attempt to get a workspace root (or first root)
    let resolved: string | undefined;
    if (task.scope instanceof Object) {
      resolved = (task.scope as WorkspaceFolder).uri.path;
    } else if (size(workspace.workspaceFolders) > 0) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- verified in line above
      resolved = workspace.workspaceFolders![0].uri.path;
    }
    return resolved ? path.resolve(resolved) : resolved;
  }
}
