import { WorkspaceEdit } from "vscode";

export interface ISnippet {
  getMessages(): any;
  getQuestions(): Promise<any[]>;
  getWorkspaceEdit(answers: any): Promise<WorkspaceEdit | undefined>;
}
