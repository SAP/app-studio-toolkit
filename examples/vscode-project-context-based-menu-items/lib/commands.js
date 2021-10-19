/*
 * This file is responsible for registering and executing the
 * `Install Dependencies` and `Run Tests` commands.
 */
const { commands, window } = require("vscode");

function registerCommands(subscriptions) {
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

function capPreviewCommand(resourceUri) {
  window.showInformationMessage(
    `Previewing LCAP, resource: <${resourceUri.fsPath}>`
  );
}

function ui5DeployCommand(resourceUri) {
  window.showInformationMessage(
    `Deploying UI5, resource: <${resourceUri.fsPath}>`
  );
}

function ui5EditManifestCommand(resourceUri) {
  window.showInformationMessage(
    `Editing UI5 Manifest, resource: <${resourceUri.fsPath}>`
  );
}

module.exports = {
  registerCommands,
};
