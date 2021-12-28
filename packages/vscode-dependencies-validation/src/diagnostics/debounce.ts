import type { Uri } from "vscode";
import { workspace } from "vscode";
import { debounce } from "lodash";
import { refreshDiagnostics } from "../diagnostics";

type RefreshDiagnosticsFunc = typeof refreshDiagnostics;
const OPTIMIZED_PATHS_TO_FUNC: Map<
  string,
  { func: RefreshDiagnosticsFunc; uri: Uri }
> = new Map();

// we are using a fairly long `wait` because the operation of detecting package.json
// dependencies issues is very heavy.
// https://ux.stackexchange.com/questions/95336/how-long-should-the-debounce-timeout-be
const DEBOUNCE_WAIT = 2000;

// TODO: test only the caching
//      - prop1: by URI identity
//      - prop2: NOT original `refreshDiagnostics` function
export function getOptimizedRefreshDiagnostics(
  uri: Uri
): RefreshDiagnosticsFunc {
  if (!OPTIMIZED_PATHS_TO_FUNC.has(uri.fsPath)) {
    const debounced = debounce(refreshDiagnostics, DEBOUNCE_WAIT, {
      trailing: true,
    });
    OPTIMIZED_PATHS_TO_FUNC.set(uri.fsPath, {
      func: debounced as RefreshDiagnosticsFunc,
      uri,
    });
  }
  return OPTIMIZED_PATHS_TO_FUNC.get(uri.fsPath)!.func;
}

const SECOND = 1000;
const MINUTE = 60 * SECOND;
// The interval is quite long, because this type of "garbage" represents an extremely rare edge case
//    - Having tens of thousands (or more) package.json files available (at some point) inside the workspace
//    - While **not** being inside of `node_modules`
//
// So a large interval is used to reduce filesystem load from this cleanup process.
const GC_INTERVAL = 15 * MINUTE;

// TODO: eslint comment that the TCO of such test is too high
setInterval(() => {
  try {
    garbageCollect(workspace.getWorkspaceFolder);
  } catch (e) {
    // TODO: log this error once logging is implemented
  }
}, GC_INTERVAL);

/**
 * A naive cleanup which removes references to the debounced functions
 */
// TODO: test deletion from the `Map`
function garbageCollect(
  getWorkspaceFolder: typeof workspace.getWorkspaceFolder
): void {
  const entries = OPTIMIZED_PATHS_TO_FUNC.entries();
  for (const [fsPath, { uri }] of entries) {
    const isOutSideWorkspace = getWorkspaceFolder(uri) === undefined;
    if (isOutSideWorkspace) {
      OPTIMIZED_PATHS_TO_FUNC.delete(fsPath);
    }
  }
}

export const internal = {
  OPTIMIZED_PATHS_TO_FUNC,
  garbageCollect,
};
