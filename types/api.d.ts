import {Uri} from 'vscode';

declare interface BasToolkit {
    getExtensionAPI: <T>(extensionId: string) => Promise<T>;
    getAction: (actionId: string) => IAction | undefined;
    getParameter: (parameterName: string) => Promise<string | undefined>;

    actions: {
        // TODO: what is the specific return type?
        performAction: (action: basAction, options?: any) => Thenable<void>;
        /**
         * @deprecated - **DON'T USE**, this class will be removed in the  near future.
         * Manually construct an object literal which matches the IExecuteAction interface instead.
         * ```javascript
         *  const myAction = {
         *      actionType: "EXECUTE"
         *      executeAction: () => ""
         *  }
         * ```
         */
        ExecuteAction: { new(): IExecuteAction };
        /**
         * @deprecated - **DON'T USE**, this class will be removed in the  near future.
         * Manually construct an object literal which matches the ISnippetAction interface instead.
         * ```javascript
         *  const myAction = {
         *      actionType: "SNIPPET"
         *      contributorId: "contributorId"
         *      snippetName: "snippetName"
         *      context: {}
         *  }
         * ```
         */
        SnippetAction: { new(): ISnippetAction };
        /**
         * @deprecated - **DON'T USE**, this class will be removed in the  near future.
         * Manually construct an object literal which matches the ICommandAction interface instead.
         * ```javascript
         *  const myAction = {
         *      actionType: "COMMAND"
         *      name: "actionName"
         *  }
         * ```
         */
        CommandAction: { new(): ICommandAction };
        /**
         * @deprecated - **DON'T USE**, this class will be removed in the  near future.
         * Manually construct an object literal which matches the IFileAction interface instead.
         * ```javascript
         *  const myAction = {
         *      actionType: "FILE"
         *      uri: vscode.Uri.parse("")
         *  }
         * ```
         */
        FileAction: { new(): IFileAction };
    };
}

declare const bas: BasToolkit;

declare type ActionType = "EXECUTE" | "COMMAND" | "TASK" | "FILE" | "SNIPPET"

// TODO: should we use generic in the params?
declare type CommandActionParams = any[];
declare type ExecuteActionParams = any[];
declare type SnippetActionParams = Record<string,any>

type basAction = IExecuteAction | ICommandAction | IFileAction | ISnippetAction;

interface IAction {
    id?: string;
    actionType: ActionType;
}

// TODO: what is the default?
interface IExecuteAction<T=any> extends IAction {
    actionType: "EXECUTE";
    executeAction: (params?: ExecuteActionParams) => Thenable<T>;
    params?: ExecuteActionParams;
}

interface ICommandAction extends IAction {
    actionType: "COMMAND";
    name: string;
    params?: CommandActionParams;
}

interface ISnippetAction extends IAction {
    actionType: "SNIPPET";
    contributorId: string;
    snippetName: string;
    context: SnippetActionParams;
    isNonInteractive?: boolean;
}

interface IFileAction extends IAction {
    actionType: "FILE";
    uri: Uri;
}
