import type { Uri } from "vscode";
import { workspace } from "vscode";
import { debounce } from "lodash";
import { refreshDiagnostics } from "./refreshDiagnostics";
import { getLogger } from "../logger/logger";

type RefreshDiagnosticsFunc = typeof refreshDiagnostics;
const OPTIMIZED_PATHS_TO_FUNC: Map<
  string,
  { func: RefreshDiagnosticsFunc; uri: Uri }
> = new Map();

// https://ux.stackexchange.com/questions/95336/how-long-should-the-debounce-timeout-be
// If the debounce is too small, changes may not be persisted in time to the disk for our
// the validation logic to run correctly.
const DEBOUNCE_WAIT = 1500;

export function getOptimizedRefreshDiagnostics(
  uri: Uri
): RefreshDiagnosticsFunc {
  if (!OPTIMIZED_PATHS_TO_FUNC.has(uri.path)) {
    const debounced = debounce(refreshDiagnostics, DEBOUNCE_WAIT, {
      // using trailing edge to wait until the end of the wait timeout, to allow time
      // for VSCode to persist the changes to the "disk".
      trailing: true,
    });
    OPTIMIZED_PATHS_TO_FUNC.set(uri.path, {
      func: debounced as RefreshDiagnosticsFunc,
      uri,
    });
  }
  return OPTIMIZED_PATHS_TO_FUNC.get(uri.path)!.func;
}

const SECOND = 1000;
const MINUTE = 60 * SECOND;
// The interval is quite long, because this type of "garbage" represents an extremely rare edge case
//    - Having tens of thousands (or more) package.json files available (at some point) inside the workspace
//    - While **not** being inside of `node_modules`
//
// So a large interval is used to reduce filesystem load from this cleanup process.
const GC_INTERVAL = 15 * MINUTE;

/* istanbul ignore next -- TCO of testing this setInterval is too high*/
setInterval(() => {
  try {
    garbageCollect(workspace.getWorkspaceFolder);
  } catch (e) {
    getLogger().getChildLogger({ label: "debounce" }).error(e.stack);
  }
}, GC_INTERVAL).unref(); // with `unref()` the process will never be "done" and mocha will never exit

/**
 * A naive cleanup which removes references to the debounced functions
 */
function garbageCollect(
  getWorkspaceFolder: typeof workspace.getWorkspaceFolder
): void {
  const entries = OPTIMIZED_PATHS_TO_FUNC.entries();
  for (const [path, { uri }] of entries) {
    const isOutSideWorkspace = getWorkspaceFolder(uri) === undefined;
    if (isOutSideWorkspace) {
      OPTIMIZED_PATHS_TO_FUNC.delete(path);
    }
  }
}

export const internal = {
  OPTIMIZED_PATHS_TO_FUNC,
  garbageCollect,
};
