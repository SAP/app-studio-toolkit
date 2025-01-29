const pathToVersion: Map<string, number> = new Map();

/**
 * Helper to identify when a newly persisted document in vscode represents
 * the latest version.
 *
 * This is needed to help identify which of the **four** events `onDidChangeTextDocument`
 * which happen on every key click is the "real" trigger for updating the diagnostics
 */
export function isNewPersistedFileVersion(
  path: string,
  newVer: number
): boolean {
  if (pathToVersion.has(path)) {
    const oldVer = pathToVersion.get(path)!;
    if (newVer > oldVer) {
      pathToVersion.set(path, newVer);
      return true;
    } else {
      return false;
    }
  } else {
    pathToVersion.set(path, newVer);
  }

  return false;
}
