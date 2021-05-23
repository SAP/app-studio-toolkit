import {Uri} from 'vscode';

declare interface BasToolkit {
    getExtensionAPI: <T>(extensionId: string) => Promise<T>;
    getAction: (actionId: string) => IAction | undefined;
    getParameter: (parameterName: string) => Promise<string | undefined>;

    actions: {
        performAction: (action: IAction, options?: any) => Thenable<void>;
        // TODO: why do we expose these classes?
        //       - they all have empty constructors
        // or should they be exposed at the root level for easier imports?
        ExecuteAction: { new(): IExecuteAction };
        SnippetAction: { new(): ISnippetAction }
        CommandAction: { new(): ICommandAction };
        FileAction: { new(): IFileAction }
    };
}

declare const bas: BasToolkit

// TODO: enums have a runtime component as well
//       however, this runtime component is not exported from the extension's `activate()` method...
//       should probably expose some string type consts instead.
declare enum ActionType {
    Execute = "EXECUTE",
    Command = "COMMAND",
    Task = "TASK",
    File = "FILE",
    Snippet = "SNIPPET"
}

declare enum ActionJsonKey {
    ActionType = "actionType",
    CommandName = "commandName",
    CommandParams = "commandParams",
    Uri = "uri"
}

// TODO: should params be typed as `unknown`?
declare type CommandActionParams = any[];
declare type ExecuteActionParams = any[];
declare type SnippetActionParams = any | {
    data: any;
    service: any;
} | {
    data: any;
};

interface IAction {
    id?: string;
    // TODO: why should `ActionType` be allowed to be `undefined`?
    actionType: ActionType | undefined;
}

interface IExecuteAction extends IAction {
    // TODO: should we use `unknown` instead of `any`
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
