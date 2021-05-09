import { Uri } from 'vscode';

export enum ActionType {
    Execute = "EXECUTE",
    Command = "COMMAND",
    Task = "TASK",
    File = "FILE",
    Snippet = "SNIPPET"
}

export enum ActionJsonKey {
    ActionType = "actionType",
    CommandName = "commandName",
    CommandParams = "commandParams",
    Uri = "uri"
}

export type CommandActionParams = any [];
export type ExecuteActionParams = any [];
export type SnippetActionParams = any | {data: any, service: any} | {data: any};
export type FileActionParams = Uri;

export interface IAction {
    id?: string;
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
    isNonInteractive?: boolean;
    contributorId: string;
    snippetName: string;
    context: SnippetActionParams;
}

export interface IFileAction extends IAction {
    uri: FileActionParams;
}
