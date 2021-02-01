import * as vscode from "vscode";

export enum ActionType {
    Execute = "EXECUTE",
    Command = "COMMAND",
    Task = "TASK",
    File = "FILE",
    Snippet = "SNIPPET"
}

export type CommandActionParams = any [];
export type ExecuteActionParams = any [];
export type SnippetActionParams = any;
export type FileActionParams = vscode.Uri;

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
