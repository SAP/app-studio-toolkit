import {Uri} from 'vscode';

declare interface BasToolkit {
    getExtensionAPI: <T>(extensionId: string) => Promise<T>;
    getAction: (actionId: string) => IAction | undefined;
    getParameter: (parameterName: string) => Promise<string | undefined>;

    actions: {
        performAction: (action: IAction, options?: any) => Thenable<void>;
        ExecuteAction: { new(): IExecuteAction };
        SnippetAction: { new(): ISnippetAction };
        CommandAction: { new(): ICommandAction };
        FileAction: { new(): IFileAction };
    };
}

declare const bas: BasToolkit;

declare type ActionType = "EXECUTE" | "COMMAND" | "TASK" | "FILE" | "SNIPPET"

declare type CommandActionParams = any[];
declare type ExecuteActionParams = any[];
declare type SnippetActionParams = Record<string,any>

interface IAction {
    id?: string;
    actionType: ActionType | undefined;
}

interface IExecuteAction extends IAction {
    executeAction: (params?: ExecuteActionParams) => Thenable<any>;
    params?: ExecuteActionParams;
}

interface ICommandAction extends IAction {
    name: string;
    params?: CommandActionParams;
}

interface ISnippetAction extends IAction {
    contributorId: string;
    snippetName: string;
    context: SnippetActionParams;
    isNonInteractive?: boolean;
}

interface IFileAction extends IAction {
    uri: Uri;
}
