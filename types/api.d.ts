import {Uri} from 'vscode';

declare interface BasToolkit {
    /**
     * This an async wrapper for vscode extension that gets an extension by its full identifier and also wait until the target extension became active.
     */
    getExtensionAPI: <T>(extensionId: string) => Promise<T>;
    /**
     * This function receives an actionId string and return an action.
     */
    getAction: (actionId: string) => BasAction | undefined;
    /**
     * This function receives a parameter, checks if it exists as one of the parameters obtained in the URL. if so, returns the value of the parameter, otherwise returns undefined.
     */
    getParameter: (parameterName: string) => Promise<string | undefined>;

    actions: {
        /**
         * The function receives two parameters:
         * @param action - one of the actions: IExecuteAction | ICommandAction | IFileAction | ISnippetAction.
         * @param aptions - put  { schedule: true } for schedule an action for execution after restart.
         */
        performAction: <T=void>(action: BasAction, options?: any) => Thenable<T>;
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
         * Manually construct an object literal which matches the IUriAction interface instead.
         * ```javascript
         *  const myAction = {
         *      actionType: "URI"
         *      uri: vscode.Uri.parse("")
         *  }
         * ```
         */
        FileAction: { new(): IFileAction };
    };
}

declare const bas: BasToolkit;

declare type ActionType = "EXECUTE" | "COMMAND" | "TASK" | "FILE" | "SNIPPET" | "URI"
type BasAction = IExecuteAction | ICommandAction | IFileAction | ISnippetAction | IUriAction;

interface IAction {
    id?: string;
    actionType: ActionType;
}

interface IExecuteAction<R=any, P=any[]> extends IAction {
    actionType: "EXECUTE";
    executeAction: (params?: P) => Thenable<R>;
    params?: P;
}

interface ICommandAction<P=any[]> extends IAction {
    actionType: "COMMAND";
    name: string;
    params?: P;
}

interface ISnippetAction<C=Record<string,any>> extends IAction {
    actionType: "SNIPPET";
    contributorId: string;
    snippetName: string;
    context: C;
    isNonInteractive?: boolean;
}

/**
 * @deprecated - **DON'T USE**, this interface will be removed in the  near future.
 * use IUriAction interface instead.
 * ```javascript
 *  const myAction: IUriAction = {
 *      actionType: "URI"
 *      uri: vscode.Uri.parse("")
 *  }
 * ```
 */
interface IFileAction extends IAction {
    actionType: "FILE";
    uri: Uri;
}

interface IUriAction extends IAction {
    actionType: "URI";
    uri: Uri;
}
