/**
 * The VSCode specific implementation for `SetContext` function
 * Implementing this **outside** the `context-state.ts` file.
 *
 * Enables us to be fully de-coupled from `vscode` (e.g: mocks)
 */
import { commands } from "vscode";
import { SetContext } from "./types";

// using `const` instead of function to reuse the `SetContext` type
export const setContextVSCode: SetContext = (contextName, paths) => {
  void commands.executeCommand("setContext", contextName, paths);
};
