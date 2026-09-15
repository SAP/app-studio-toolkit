import { partial } from "lodash";
import { commands, ExtensionContext, window } from "vscode";
import { createExtensionLoggerAndSubscribeToLogSettingsChanges } from "./logger/logger-wrapper";
import { Contributors } from "./services/contributors";
import { TasksProvider } from "./services/tasks-provider";
import { TasksTree } from "./view/tasks-tree";
import { executeTaskFromTree } from "./commands/execute-task";
import { deleteTask } from "./commands/delete-task";
import { editTreeItemTask } from "./commands/edit-task";
import { createTask } from "./commands/create-task";
import { messages } from "./i18n/messages";
import { TASKS_EXPLORER_ID } from "./logger/settings";
import { readResource } from "./utils/resource-reader";
import { revealTask } from "./commands/reveal-task";
import { duplicateTask } from "./commands/duplicate-task";
import { terminateTaskFromTree } from "./commands/terminate-task";
import { selectTreeItem } from "./commands/select-tree-item";
import { actionDeploy } from "./commands/action-deploy";
import { subscribeTaskRun } from "./commands/action";
import { actionBuild } from "./commands/action-build";
import { AnalyticsWrapper } from "./usage-report/usage-analytics-wrapper";

let extensionPath = "";

export async function activate(context: ExtensionContext): Promise<void> {
  extensionPath = context.extensionPath;

  initializeLogger(context);
  AnalyticsWrapper.createTracker(context);

  const contributors = Contributors.getInstance();
  void contributors.init();
  const tasksProvider = new TasksProvider(contributors);
  const tasksTree = new TasksTree(tasksProvider);
  const view = window.createTreeView("tasksPanel", { treeDataProvider: tasksTree, showCollapseAll: true });

  view.onDidChangeVisibility((e) => {
    AnalyticsWrapper.reportViewVisibility({ visible: e.visible });
  });

  context.subscriptions.push(
    commands.registerCommand("tasks-explorer.editTask", partial(editTreeItemTask, tasksProvider, readResource)),
  );
  context.subscriptions.push(commands.registerCommand("tasks-explorer.deleteTask", deleteTask));
  context.subscriptions.push(commands.registerCommand("tasks-explorer.revealTask", revealTask));
  context.subscriptions.push(commands.registerCommand("tasks-explorer.duplicateTask", duplicateTask));
  context.subscriptions.push(commands.registerCommand("tasks-explorer.executeTask", executeTaskFromTree));
  context.subscriptions.push(commands.registerCommand("tasks-explorer.stopTask", terminateTaskFromTree));
  context.subscriptions.push(
    commands.registerCommand("tasks-explorer.createTask", partial(createTask, tasksProvider, readResource)),
  );
  context.subscriptions.push(commands.registerCommand("tasks-explorer.tree.refresh", () => tasksTree.onChange()));
  context.subscriptions.push(
    commands.registerCommand("tasks-explorer.tree.select", partial(selectTreeItem, view, tasksTree, tasksProvider)),
  );
  context.subscriptions.push(
    commands.registerCommand("tasks-explorer.action.build", partial(actionBuild, tasksTree, tasksProvider, context)),
  );
  context.subscriptions.push(
    commands.registerCommand("tasks-explorer.action.deploy", partial(actionDeploy, tasksTree, tasksProvider, context)),
  );
  context.subscriptions.push(subscribeTaskRun(context));
}

function initializeLogger(context: ExtensionContext): void {
  const outputChannel = window.createOutputChannel(TASKS_EXPLORER_ID);
  try {
    createExtensionLoggerAndSubscribeToLogSettingsChanges(context, outputChannel);
  } catch (error) {
    outputChannel.appendLine(messages.LOGGER_NOT_AVAILABLE());
  }
}

export function getExtensionPath(): string {
  return extensionPath;
}
