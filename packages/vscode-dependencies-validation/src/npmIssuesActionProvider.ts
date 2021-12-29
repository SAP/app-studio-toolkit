import type {
  CancellationToken,
  CodeActionContext,
  CodeActionProvider,
  Command,
  Diagnostic,
  Range,
  Selection,
  TextDocument,
  CodeAction,
  CodeActionKind,
  Uri,
} from "vscode";
import {
  NPM_DEPENDENCY_ISSUES_CODE,
  FIX_ALL_ISSUES_COMMAND,
  PACKAGE_JSON_FILTER,
} from "./constants";
import { VscodeCodeActionProviderConfig } from "./vscodeTypes";

export function registerCodeActionsProvider(
  vscodeConfig: VscodeCodeActionProviderConfig
): NPMIssuesActionProvider {
  const { subscriptions, languages, kind } = vscodeConfig;

  const provider = new NPMIssuesActionProvider(kind);
  subscriptions.push(
    languages.registerCodeActionsProvider(
      { language: "json", pattern: PACKAGE_JSON_FILTER },
      provider,
      {
        providedCodeActionKinds: [kind],
      }
    )
  );

  return provider;
}

export class NPMIssuesActionProvider implements CodeActionProvider {
  constructor(private kind: CodeActionKind) {}

  public provideCodeActions(
    document: TextDocument,
    range: Range | Selection,
    context: CodeActionContext,
    token: CancellationToken
  ): CodeAction[] {
    // for each diagnostic entry create a code action command
    return context.diagnostics
      .filter((diagnostic) => diagnostic.code === NPM_DEPENDENCY_ISSUES_CODE)
      .map((diagnostic) => this.createCodeAction(diagnostic, document.uri));
  }

  private createCodeAction(diagnostic: Diagnostic, uri: Uri): CodeAction {
    const action: CodeAction = {
      title: "Fix all dependency issues",
      kind: this.kind,
    };

    action.command = createCommand(uri);
    action.diagnostics = [diagnostic];
    action.isPreferred = true;

    return action;
  }
}

function createCommand(uri: Uri): Command {
  return {
    command: FIX_ALL_ISSUES_COMMAND,
    title: "Fix all dependency issues",
    arguments: [uri],
  };
}
