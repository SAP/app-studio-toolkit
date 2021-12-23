/*
 * This file is responsible for registering and "executing" the (dummy) custom context commands
 */
import { commands, Uri, window } from "vscode";

export function registerCommands(subscriptions: { dispose(): any }[]): void {
  subscriptions.push(
    commands.registerCommand("extension.capPreview", capPreviewCommand)
  );

  subscriptions.push(
    commands.registerCommand("extension.ui5Deploy", ui5DeployCommand)
  );

  subscriptions.push(
    commands.registerCommand(
      "extension.ui5EditManifest",
      ui5EditManifestCommand
    )
  );
}

function capPreviewCommand(resourceUri: Uri): void {
  void window.showInformationMessage(
    `bas_project_types:cap, resource: <${resourceUri.fsPath}>`
  );
}

function ui5DeployCommand(resourceUri: Uri): void {
  void window.showInformationMessage(
    `bas_project_types:ui5, resource: <${resourceUri.fsPath}>`
  );
}

function ui5EditManifestCommand(resourceUri: Uri): void {
  void window.showInformationMessage(
    `bas_project_types:ui5 + 'manifest.json', resource: <${resourceUri.fsPath}>`
  );
}
