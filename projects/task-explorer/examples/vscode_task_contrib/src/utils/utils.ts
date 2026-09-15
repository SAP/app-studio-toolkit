import { find, map } from "lodash";
import { workspace, WorkspaceFolder } from "vscode";

const datauri = require("datauri/sync");

export function getImage(imagePath: string): string {
  let image;
  try {
    image = datauri(imagePath).content;
  } catch (error) {
    // image = DEFAULT_IMAGE;
  }
  return image;
}

export function getWorkspaceFolders(): string[] {
  if (workspace.workspaceFolders === undefined) {
    return [];
  }
  return map(workspace.workspaceFolders, (_) => _.uri.fsPath);
}

export function getWorkspaceFolderByPath(path: string): WorkspaceFolder | undefined {
  const wsFolders = workspace.workspaceFolders;
  if (wsFolders === undefined) {
    return undefined;
  }
  return find(wsFolders, (_) => path.startsWith(_.uri.fsPath));
}
