import { Uri } from "vscode";
import { WorkspaceApi, Tag } from "@sap/artifact-management-types";

/**
 * re-export of the types from `@sap/artifact-management-types for convenience
 * Example usage:
 *
 * ```typescript
 *   import { sam } from "@sap-devx/app-studio-toolkit-types";
 *
 *   interface Foo {
 *      x: sam.Item
 *      y: sam.Module
 *   }
 * ```
 */
export * as sam from "@sap/artifact-management-types";

export type SapProjectType = "sapProjectType";
export type VSCodeContextSeparator = ":";
export type TagKey = keyof typeof Tag;

/**
 * The names of Custom VSCode contexts which can be used to define custom menu items
 * depending on the resource's (file/folder) "project type" tags.
 * - as defined by @sap/artifact-management package.
 *
 * For example: in a UI5 project the `webapp/manifest.json` file would be tagged with the `ui5` tag.
 * This means a custom VSCode context named `sapProjectType:ui5` will be automagically populated
 * and can then be used to create custom menu items for the UI5 `manifest.json`, e.g:
 *
 * In `package.json` of VSCode extension in `contributes.menus."explorer/context"` section:
 * ```json
 *   {
 *         "command": "extension.ui5EditManifest",
 *         "when": "resourcePath in sapProjectType:ui5 && resourceFilename == manifest.json"
 *    }
 * ```
 * Note that:
 * - The "project type" custom context (`sapProjectType:ui5`) uses the `sapProjectType:` prefix and the
 *   tag name (`ui5` in this case) as the suffix.
 * - The usage of the `in` **operator** in conjunction with `resourcePath` **editor context**.
 * - A matching custom context would be created for **all** the tags detected in the workspace, e.g:
 *   `ui5` / `cap` / `ui` / ...
 *
 * Relevant References:
 * - https://code.visualstudio.com/api/references/when-clause-contexts
 * - https://code.visualstudio.com/api/references/when-clause-contexts#in-conditional-operator
 * - https://github.com/SAP/app-studio-toolkit/tree/main/examples/vscode-artifact-management-context-menus
 */
export type VSCodeProjectTypeContext =
  `${SapProjectType}${VSCodeContextSeparator}${TagKey}`;

export type BasWorkspaceApi = Pick<
  WorkspaceApi,
  "getProjects" | "getProjectUris" | "onWorkspaceChanged"
>;

export interface BasToolkit {
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
   * Determine whether BAS is opened for running action or editing a project
   *
   * @experimental may be removed without notice in future versions.
   *
   * @returns true if is the actions in deep-link are opened with no visible project,
   *          false otherwise.
   */
  isOpenedForAction: () => Promise<boolean | undefined>;

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

export type ActionType =
  | "EXECUTE"
  | "COMMAND"
  | "TASK"
  | "FILE"
  | "SNIPPET"
  | "URI";

export type BasAction =
  | IExecuteAction
  | ICommandAction
  | IFileAction
  | ISnippetAction
  | IUriAction;

export interface IAction {
  id?: string;
  actionType: ActionType;
}

export interface IExecuteAction<R = any, P = any[]> extends IAction {
  actionType: "EXECUTE";
  executeAction: (params?: P) => Thenable<R>;
  params?: P;
}

export interface ICommandAction<P = any[]> extends IAction {
  actionType: "COMMAND";
  name: string;
  params?: P;
}

export interface ISnippetAction<C = Record<string, any>> extends IAction {
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
export interface IFileAction extends IAction {
  actionType: "FILE";
  uri: Uri;
}

export interface IUriAction extends IAction {
  actionType: "URI";
  uri: Uri;
}
