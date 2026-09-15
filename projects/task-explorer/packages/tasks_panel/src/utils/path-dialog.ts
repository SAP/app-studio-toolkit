import { get } from "lodash";
import { homedir } from "os";
import { Uri, window } from "vscode";
import { getTaskEditor } from "../panels/panels-handler";

// This function provides file/folder browsing functionality of "file" and "folder"
// elements on the task editor view
export async function showOpenDialog(
  currentPath: string,
  canSelectFiles: boolean,
  canSelectFolders: boolean,
): Promise<string> {
  const dialogResourcePath = getDialogResourcePath(currentPath);
  let dialogResourceUri;
  try {
    dialogResourceUri = Uri.file(dialogResourcePath);
  } catch (e) {
    dialogResourceUri = Uri.file(homedir());
  }

  try {
    const filePath = await window.showOpenDialog({
      canSelectFiles,
      canSelectFolders,
      defaultUri: dialogResourceUri,
    });
    return filePath === undefined
      ? currentPath // if user cancels dialog, input path is returned
      : get(filePath, "[0].fsPath", dialogResourcePath);
  } catch (error) {
    return currentPath;
  }
}

// function returns the resource the dialog shows when opened:
// if `providedDefaultPath` is empty, the resource is set
// to the workspace folder of the editing task
function getDialogResourcePath(providedDefaultPath: string): string {
  let defaultPath = providedDefaultPath;
  if (defaultPath === "") {
    const taskEditor = getTaskEditor();
    if (taskEditor !== undefined) {
      defaultPath = taskEditor.getTaskWsFolder();
    }
  }
  return defaultPath;
}
