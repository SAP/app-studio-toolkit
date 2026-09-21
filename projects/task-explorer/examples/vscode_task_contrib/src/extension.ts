import { ExtensionContext, tasks } from "vscode";
import {
  ConfiguredTask,
  TaskEditorContributorExtensionAPI,
} from "@sap_oss/task_contrib_types";
import { NPM_SCRIPT_TYPE } from "./npm_script/script-definitions";
import { ScriptTaskProvider } from "./npm_script/script-task-provider";
import { ScriptTaskExplorerContributor } from "./npm_script/script-task-explorer-contributor";

export function activate(
  context: ExtensionContext
): TaskEditorContributorExtensionAPI<ConfiguredTask> {
  // extension that contributes to Tasks Explorer has to provide:
  // 1. Task Provider
  tasks.registerTaskProvider(NPM_SCRIPT_TYPE, new ScriptTaskProvider());

  // 2. Task Contributors
  return {
    getTaskEditorContributors(): Map<string, ScriptTaskExplorerContributor> {
      const contributors = new Map<string, ScriptTaskExplorerContributor>();
      contributors.set(
        NPM_SCRIPT_TYPE,
        new ScriptTaskExplorerContributor(context.extensionPath)
      );
      return contributors;
    },
  };
}
