import { Dictionary, filter, map, zipObject } from "lodash";
import { workspace } from "vscode";
import { getWorkspaceFolders } from "./utils";

export async function getTaskSources(
  filename: string
): Promise<Dictionary<string[]>> {
  const uris = await workspace.findFiles(filename, "**/node_modules/**");
  const paths: string[] = map(uris, (_) => _.fsPath);
  const wsFolders = getWorkspaceFolders();
  return zipObject(
    wsFolders,
    map(wsFolders, (wsFolder) => {
      return filter(paths, (_) => _.startsWith(wsFolder));
    })
  );
}
