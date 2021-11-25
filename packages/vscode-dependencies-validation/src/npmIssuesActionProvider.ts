import {
  CancellationToken,
  CodeAction,
  CodeActionContext,
  CodeActionKind,
  CodeActionProvider,
  Diagnostic,
  Range,
  Selection,
  TextDocument,
} from "vscode";
import { NPM_DEPENDENCY_ISSUE } from "./diagnostics";
import { get } from "lodash";

export class NPMIssuesActionProvider implements CodeActionProvider {
  public static readonly providedCodeActionKinds = [CodeActionKind.QuickFix];

  provideCodeActions(
    document: TextDocument,
    range: Range | Selection,
    context: CodeActionContext,
    token: CancellationToken
  ): CodeAction[] {
    // for each diagnostic entry create a code action command
    return context.diagnostics
      .filter((diagnostic) => diagnostic.code === NPM_DEPENDENCY_ISSUE)
      .map((diagnostic) => this.createCommandCodeAction(diagnostic));
  }

  private createCommandCodeAction(diagnostic: Diagnostic): CodeAction {
    const action = new CodeAction(
      "Fix dependency issue",
      CodeActionKind.QuickFix
    );
    action.command = {
      command: "deps.install",
      title: "installing title ...",
      tooltip: "installing tooltip ...",
      arguments: [
        get(diagnostic, "depIssue"),
        get(diagnostic, "packageJsonPath"),
      ],
    };
    action.diagnostics = [diagnostic];
    action.isPreferred = true;
    return action;
  }
}
