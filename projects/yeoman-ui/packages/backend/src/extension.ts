import type { ExtensionContext, WebviewPanel } from "vscode";
import { vscode } from "./utils/vscodeProxy.js";
import { internalApi as _loggerApi } from "./logger/logger-wrapper.js";
import { AnalyticsWrapper } from "./usage-report/usage-analytics-wrapper.js";
import * as shellJsWorkarounds from "./utils/shellJsWorkarounds.js";
import { ExtCommands } from "./extCommands.js";

let extCommands: ExtCommands;

export async function activate(context: ExtensionContext) {
  shellJsWorkarounds.apply();

  extCommands = new ExtCommands(context);

  // performs first time lookup of installed generators
  // runs in background
  void import("./utils/env.js");

  try {
    _loggerApi.createExtensionLoggerAndSubscribeToLogSettingsChanges(context);
    await AnalyticsWrapper.createTracker(context);
  } catch (error) {
    console.error("Extension activation failed.", error.message);
    return;
  }

  extCommands.registerAndSubscribeCommands();

  context.subscriptions.push(
    vscode.window.registerWebviewPanelSerializer("yeomanui", {
      async deserializeWebviewPanel(
        webViewPanel: WebviewPanel,
        state?: unknown
      ) {
        (await extCommands.getYeomanUIPanel()).setWebviewPanel(
          webViewPanel,
          state
        );
      },
    })
  );

  context.subscriptions.push(
    vscode.window.registerWebviewPanelSerializer("exploreGens", {
      async deserializeWebviewPanel(
        webViewPanel: WebviewPanel,
        state?: unknown
      ) {
        (await extCommands.getExploreGensPanel()).setWebviewPanel(
          webViewPanel,
          state
        );
      },
    })
  );
}

export function deactivate() {
  extCommands = null;
}
