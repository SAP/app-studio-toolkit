import * as vscode from "vscode";

// Don't change the types - used by bas-cli!
export enum ActionType {
    Execute = "EXECUTE",
    Command = "COMMAND",
    Task = "TASK",
    File = "FILE",
    Snippet = "SNIPPET",
    OpenBrowser = "OPEN_BROWSER"
}

export type CommandActionParams = any [];
export type ExecuteActionParams = any [];
export type SnippetActionParams = any;
export type FileActionParams = vscode.Uri;
export type OpenBrowserActionParams = vscode.Uri;

export interface IAction {
    actionType: ActionType | undefined;
}

export interface IExecuteAction extends IAction {
    executeAction: (params?: ExecuteActionParams) => Thenable<any>;
    params?: ExecuteActionParams;
}

export interface ICommandAction extends IAction {
    name: string;
    params?: CommandActionParams;
}

export interface ISnippetAction extends IAction {
    contributorId: string;
    snippetName: string;
    context: SnippetActionParams;
}

export interface IFileAction extends IAction {
    uri: FileActionParams;
}

export interface IOpenBrowserAction extends IAction {
    uri: OpenBrowserActionParams;
}
