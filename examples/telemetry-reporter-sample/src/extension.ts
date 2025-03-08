import * as vscode from "vscode";
import {
  TelemetryProperties,
  TelemetryMeasurements,
} from "@sap-devx/app-studio-toolkit-types";

export function activate(context: vscode.ExtensionContext) {
  console.log(
    'Congratulations, your extension "telemetry-reporter-sample" is now active!'
  );

  const disposable = vscode.commands.registerCommand(
    "telemetry-reporter-sample.triggerTelemetryReport",
    () => {
      const basToolkitAPI = vscode.extensions.getExtension(
        "SAPOSS.app-studio-toolkit"
      )?.exports;

      if (basToolkitAPI) {
        const extensionVersion = context.extension.packageJSON.version;
        const extensionName = `${context.extension.packageJSON.publisher}.${context.extension.packageJSON.name}`;

        const properties: TelemetryProperties = {
          customProp1: "customPropValue1",
        };

        const measurements: TelemetryMeasurements = {
          customMeasure1: 1,
        };

        const reporter = basToolkitAPI.getTelemetryReporter(
          extensionName,
          extensionVersion
        );
        reporter.report(
          `TestTelemetryEvent-${Date.now().toString()}`,
          properties,
          measurements
        );
        void vscode.window.showInformationMessage(
          "Telemetry report triggered!"
        );
      }
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
