import * as vscode from "vscode";

export interface AppEvents {
  doApply(we: vscode.WorkspaceEdit): Promise<any>;
  doSnippeDone(
    success: boolean,
    message: string,
    targetFolderPath?: string
  ): void;
  doClose(): void;
  executeCommand(id: string, ...args: any[]): Thenable<any>;
}
