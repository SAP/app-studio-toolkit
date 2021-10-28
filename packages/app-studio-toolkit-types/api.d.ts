import { Uri } from "vscode";
import { WorkspaceApi } from "@sap/artifact-management-types";

declare type BasWorkspaceApi = Pick<
  WorkspaceApi,
  "getProjects" | "getProjectUris" | "onWorkspaceChanged"
>;

declare interface BasToolkit {
  /**
   * An **async** wrapper for `vscode.extensions.getExtension()`
   * - See: https://code.visualstudio.com/api/references/vscode-api#extensions.getExtension
   *
   * Note that:
   * - If the `targetExtId` does not exist the promise will be rejected.
   * - If the `targetExtId` exists but is **in-active**, the promise
   *   will remain unresolved until `targetExtId` has become active.
   *   Keep in mind that this may cause a "soft deadlock" if `targetExtId`
   *   **never** becomes active.
   */
  getExtensionAPI: <T>(targetExtId: string) => Promise<T>;

  /**
   * @param id - the target BAS action name to seek.
   *
   * @returns - the matching BasAction for the `id`
   *            or undefined if no action matching `actionId` can be located.
   *
   * Note that BasActions are often registered using the `basContributes`
   * section of a VSCode extension's package.json.
   */
  getAction: (id: string) => BasAction | undefined;

  /**
   * Is environment LCAP or not
   *
   * @returns true is environment is LCAP in BAS,
   *          `undefined` otherwise.
   */
  isLCAPEnabled: () => Promise<boolean | undefined>;

  /**
   * @param action - The action to invoke/call/execute.
   * @param [options.schedule] - Schedule performing the action **after** a restart.
   *
   * @returns - The return type depends on the type of of BasAction "performed".
   *            Note that is the `schedule` option is used, the return type would be Thenable<Void>.
   */
  performAction: <T = void>(
    action: BasAction,
    options?: { schedule?: boolean }
  ) => Thenable<T>;

  /**
   * Singleton instance of the `@sap/artifact-management[workspace]` API
   * shared among BAS extensions to optimize performance.
   */
  workspaceAPI: BasWorkspaceApi;

  actions: {
    /**
     * @deprecated - **DON'T USE**, this function will be removed in the near future.
     *               use {@link BasToolkit.performAction} instead (without the `actions` namespace.
     *
     * @param action - The action to invoke/call/execute.
     * @param [options.schedule] - Schedule performing the action **after** a restart.
     *
     * @returns - The return type depends on the type of of BasAction "performed".
     *            Note that is the `schedule` option is used, the return type would be Thenable<Void>.
     */
    performAction: <T = void>(
      action: BasAction,
      options?: { schedule?: boolean }
    ) => Thenable<T>;

    /**
     * @deprecated - **DON'T USE**, this class will be removed in the near future.
     *               Manually construct an **object literal** which matches the {@link IExecuteAction} interface instead.
     */
    ExecuteAction: { new (): IExecuteAction };

    /**
     * @deprecated - **DON'T USE**, this class will be removed in the near future.
     *               Manually construct an **object literal** which matches the {@link ISnippetAction} interface instead.
     */
    SnippetAction: { new (): ISnippetAction };

    /**
     * @deprecated - **DON'T USE**, this class will be removed in the near future.
     *               Manually construct an **object literal** which matches the {@link ICommandAction} interface instead.
     */
    CommandAction: { new (): ICommandAction };

    /**
     * @deprecated - **DON'T USE**, this class will be removed in the near future.
     *               Manually construct an **object literal** which matches the {@link IUriAction} interface instead.
     */
    FileAction: { new (): IFileAction };
  };
}

declare const bas: BasToolkit;

declare type ActionType =
  | "EXECUTE"
  | "COMMAND"
  | "TASK"
  | "FILE"
  | "SNIPPET"
  | "URI";

type BasAction =
  | IExecuteAction
  | ICommandAction
  | IFileAction
  | ISnippetAction
  | IUriAction;

interface IAction {
  id?: string;
  actionType: ActionType;
}

interface IExecuteAction<R = any, P = any[]> extends IAction {
  actionType: "EXECUTE";
  executeAction: (params?: P) => Thenable<R>;
  params?: P;
}

interface ICommandAction<P = any[]> extends IAction {
  actionType: "COMMAND";
  name: string;
  params?: P;
}

interface ISnippetAction<C = Record<string, any>> extends IAction {
  actionType: "SNIPPET";
  contributorId: string;
  snippetName: string;
  context: C;
  isNonInteractive?: boolean;
}

/**
 * @deprecated - **DON'T USE**, this interface will be removed in the near future.
 *               use the {@link IUriAction} interface instead.
 */
interface IFileAction extends IAction {
  actionType: "FILE";
  uri: Uri;
}

interface IUriAction extends IAction {
  actionType: "URI";
  uri: Uri;
}
