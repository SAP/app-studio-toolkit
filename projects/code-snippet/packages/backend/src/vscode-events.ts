import * as vscode from "vscode";
import { AppEvents } from "./app-events";

export class VSCodeEvents implements AppEvents {
  private webviewPanel: vscode.WebviewPanel;

  constructor(webviewPanel: vscode.WebviewPanel) {
    this.webviewPanel = webviewPanel;
  }

  public async doApply(we: vscode.WorkspaceEdit): Promise<any> {
    // Apply code
    await vscode.workspace.applyEdit(we);
  }

  public doSnippeDone(
    success: boolean,
    message: string,
    targetFolderPath?: string
  ): void {
    this.doClose();
    this.showDoneMessage(success, message, targetFolderPath);
  }

  public doClose(): void {
    if (this.webviewPanel) {
      this.webviewPanel.dispose();
      this.webviewPanel = null;
    }
  }

  public executeCommand(id: string, ...args: any[]): Thenable<any> {
    return vscode.commands.executeCommand(id, ...args);
  }

  private showDoneMessage(
    success: boolean,
    message: string,
    targetFolderPath?: string // eslint-disable-line @typescript-eslint/no-unused-vars -- must match interface
  ): Thenable<any> {
    if (success) {
      return vscode.window.showInformationMessage(message);
    }

    return vscode.window.showErrorMessage(message);
  }
}
