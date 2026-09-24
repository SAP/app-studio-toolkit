import * as vscode from "vscode";
import {
  createExtensionLoggerAndSubscribeToLogSettingsChanges,
  getLogger,
} from "./logger/logger-wrapper";
import { CodeSnippetPanel } from "./panels/CodeSnippetPanel";
import { AbstractWebviewPanel } from "./panels/AbstractWebviewPanel";
import { AnalyticsWrapper } from "./usage-report/usage-analytics-wrapper";

let extContext: vscode.ExtensionContext;
let codeSnippetPanel: CodeSnippetPanel;

export function activate(context: vscode.ExtensionContext): void {
  extContext = context;

  try {
    createExtensionLoggerAndSubscribeToLogSettingsChanges(context);
    AnalyticsWrapper.createTracker(getLogger());
  } catch (error: any) {
    console.error(
      "Extension activation failed due to Logger configuration failure:",
      error.message
    );
    return;
  }

  codeSnippetPanel = new CodeSnippetPanel(extContext);
  registerAndSubscribeCommand(
    "loadCodeSnippet",
    codeSnippetPanel.loadWebviewPanel.bind(codeSnippetPanel)
  );
  registerAndSubscribeCommand(
    "codeSnippet.toggleOutput",
    codeSnippetPanel.toggleOutput.bind(codeSnippetPanel)
  );
  registerWebviewPanelSerializer(codeSnippetPanel);
}

function registerAndSubscribeCommand(cId: string, cAction: any) {
  extContext.subscriptions.push(vscode.commands.registerCommand(cId, cAction));
}

function registerWebviewPanelSerializer(abstractPanel: AbstractWebviewPanel) {
  extContext.subscriptions.push(
    vscode.window.registerWebviewPanelSerializer(abstractPanel.viewType, {
      async deserializeWebviewPanel(
        webViewPanel: vscode.WebviewPanel,
        state?: unknown
      ) {
        await abstractPanel.setWebviewPanel(webViewPanel, state);
      },
    })
  );
}

export function deactivate(): void {
  codeSnippetPanel = null;
}
