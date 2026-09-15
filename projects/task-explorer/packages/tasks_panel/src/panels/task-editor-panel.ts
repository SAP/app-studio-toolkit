import { WebviewPanel } from "vscode";
import { RpcExtension } from "@sap-devx/webview-rpc/out.ext/rpc-extension";
import { ConfiguredTask } from "@sap_oss/task_contrib_types";
import { AppEvents } from "../app-events";
import { TaskEditor } from "../task-editor";
import { VSCodeEvents } from "../vscode-events";
import { AbstractWebviewPanel } from "./abstract-webview-panel";
import { showOpenDialog } from "../utils/path-dialog";

export interface TaskEditorPanelState {
  task: ConfiguredTask;
}

const TASK_EDITOR_VIEW_TYPE = "Task Editor";

export class TaskEditorPanel extends AbstractWebviewPanel<TaskEditorPanelState> {
  private taskEditor: TaskEditor | undefined;

  public constructor(task: ConfiguredTask, readResource: (file: string) => Promise<string>) {
    super(readResource);
    this.viewType = TASK_EDITOR_VIEW_TYPE;
    this.focusedKey = "tasksEditor.Focused";
    this.loadWebviewPanel({ task: task });
  }

  public getTaskInProcess(): string | undefined {
    return this.taskEditor?.isTaskChanged() ? this.taskEditor.getTask().label : undefined;
  }

  public getTaskEditor(): TaskEditor | undefined {
    return this.taskEditor;
  }

  public setWebviewPanel(webviewPanel: WebviewPanel, state: TaskEditorPanelState): void {
    this.webViewPanel = webviewPanel;
    this.webViewPanel.title = state.task.label;
    this.state = state;
    const rpc = new RpcExtension(this.webViewPanel.webview);
    const vscodeEvents: AppEvents = new VSCodeEvents(this.webViewPanel);
    this.taskEditor = new TaskEditor(rpc, vscodeEvents, state.task);
    this.webViewPanel.onDidDispose(() => {
      this.taskEditor = undefined;
    });
    this.taskEditor.registerCustomQuestionEventHandler(
      "file-browser",
      "getFilePath",
      this.showOpenFileDialog.bind(this),
    );
    this.taskEditor.registerCustomQuestionEventHandler(
      "folder-browser",
      "getPath",
      this.showOpenFolderDialog.bind(this),
    );
  }

  async showOpenFileDialog(currentPath: string): Promise<string> {
    return showOpenDialog(currentPath, true, false);
  }

  async showOpenFolderDialog(currentPath: string): Promise<string> {
    return showOpenDialog(currentPath, false, true);
  }

  public getLoadedTask(): ConfiguredTask {
    return this.state.task;
  }
}
