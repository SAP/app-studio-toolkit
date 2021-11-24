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
  window,
} from "vscode";
import { NPM_DEPENDENCY_ISSUE } from "./diagnostics";

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
    const action = new CodeAction("Install", CodeActionKind.QuickFix);
    action.command = {
      command: "npm-issues-fix-command",
      title: "Learn more about json-fixer",
      tooltip: "This will open the unicode json-fixer page.",
    };
    action.diagnostics = [diagnostic];
    action.isPreferred = true;
    return action;
  }
}
