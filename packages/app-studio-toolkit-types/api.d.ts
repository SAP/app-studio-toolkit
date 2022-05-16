import { Uri } from "vscode";
import { WorkspaceApi } from "@sap/artifact-management-types";
import { PackageJson } from "type-fest";

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

/**
 * Optional additional BAS specific metadata on a VSCode extension running in BAS.
 */
export interface BASPackageJson extends PackageJson {
  BASContributes?: {
    actions?: IAction[];
    // metadata for the "NPM Dependency Upgrade Tool"
    // See: https://github.com/SAP/app-studio-toolkit/tree/main/packages/vscode-deps-upgrade-tool
    upgrade: {
      nodejs: NodeUpgradeSpec[];
    };
  };
}

export type PackageName = string;
/**
 * An exact semVer version, e.g "1.2.3"
 */
export type SemVer = string;
/**
 * See: https://github.com/npm/node-semver#ranges
 * See: https://github.com/npm/node-semver#advanced-range-syntax
 */
export type SemVerRange = string;

export interface NodeUpgradeSpec {
  /**
   * The target package name to upgrade, e.g: "eslint"
   */
  package: PackageName;
  version: {
    /**
     * The target version to upgrade, note that ranges are also supported,
     * e.g: "^7.0.0" means to upgrade all versions included in the range: `7.0.0 >= x < 8.0.0`
     */
    from: SemVer | SemVerRange;
    /**
     * The version string to upgrade to, this string will be "inserted" as is
     * in the relevant dependency **value** in the package.json
     */
    to: SemVer | SemVerRange;
  };
}

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
   * @deprecated - use the synchronized {@link BasToolkit.isLCAPEnabledSync} instead.
   */
  isLCAPEnabled: () => Promise<boolean>;

  /**
   * Is environment LCAP or not
   */
  isLCAPEnabledSync: () => boolean;

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
