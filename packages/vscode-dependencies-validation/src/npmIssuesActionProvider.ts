import {
  CancellationToken,
  CodeAction,
  CodeActionContext,
  CodeActionKind,
  CodeActionProvider,
  Command,
  Diagnostic,
  Range,
  Selection,
  TextDocument,
} from "vscode";
import { get } from "lodash";
import { NPMDependencyIssue } from "@sap-devx/npm-dependencies-validation";
import { NPM_DEPENDENCY_ISSUE } from "./diagnostics";
import { FIX_ALL_COMMAND } from "./commands";

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
    return createCodeAction(diagnostic);
  }
}

function createCommand(diagnostic: Diagnostic): Command {
  return {
    command: FIX_ALL_COMMAND,
    title: "Fix all dependency issues",
    arguments: [get(diagnostic, "packageJsonPath")],
  };
}

function createCodeAction(diagnostic: Diagnostic): CodeAction {
  const action = new CodeAction("Fix All", CodeActionKind.QuickFix);

  action.command = createCommand(diagnostic);
  action.diagnostics = [diagnostic];
  action.isPreferred = true;

  return action;
}
