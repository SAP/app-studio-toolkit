import { ExtensionContext, tasks } from "vscode";
import { ConfiguredTask, TaskEditorContributorExtensionAPI } from "@sap_oss/task_contrib_types";
import { NPM_TYPE } from "./definitions";
import { TaskExplorerContributor } from "./task-contributor";
import { NpmTaskProvider } from "./task-provider";

export function activate(context: ExtensionContext): TaskEditorContributorExtensionAPI<ConfiguredTask> {
  // extension that contributes to Tasks Explorer has to provide:
  // 1. Task Provider
  context.subscriptions.push(tasks.registerTaskProvider(NPM_TYPE, new NpmTaskProvider()));

  // 2. Task Contributors
  return {
    getTaskEditorContributors(): Map<string, TaskExplorerContributor> {
      const contributors = new Map<string, TaskExplorerContributor>();
      contributors.set(NPM_TYPE, new TaskExplorerContributor(context.extensionPath));
      return contributors;
    },
  };
}
