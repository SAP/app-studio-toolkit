/**
 * The VSCode specific implementation for `SetContext` function
 * Implementing this **outside** the `context-state.ts` file.
 *
 * Enables us to be fully de-coupled from `vscode` (e.g: mocks)
 */
import { commands } from "vscode";
import { SetContext } from "./types";

// using `const` instead of function to reuse the `SetContext` type
/* istanbul ignore next -- we need integration tests capabilities with VSCode to test this, mock tests would be useless */
export const setContextVSCode: SetContext = (contextName, paths) => {
  /* istanbul ignore next -- we need integration tests capabilities with VSCode to test this, mock tests would be useless */
  void commands.executeCommand("setContext", contextName, paths);
};
