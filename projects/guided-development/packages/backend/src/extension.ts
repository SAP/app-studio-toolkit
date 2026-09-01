import * as _ from 'lodash';
import * as vscode from 'vscode';
import { createExtensionLoggerAndSubscribeToLogSettingsChanges } from "./logger/logger-wrapper";
import { Contributors } from './contributors';
import { GuidedDevelopmentPanel } from './panels/GuidedDevelopmentPanel';
import { AbstractWebviewPanel } from './panels/AbstractWebviewPanel';
import { VSCodeEvents } from "./vscode-events";
import { bas } from '@sap-devx/app-studio-toolkit-types';
import { setSetData, managerApi } from "./api";

import GuideViewProvider from './center/guideViewProvider';

let extContext: vscode.ExtensionContext;
let guidedDevelopmentPanel: GuidedDevelopmentPanel;

export async function activate(context: vscode.ExtensionContext) {
	extContext = context;

	try {
		createExtensionLoggerAndSubscribeToLogSettingsChanges(context);
	} catch (error) {
		console.error("Extension activation failed due to Logger configuration failure:", error.message);
		return;
	}

	Contributors.getInstance().init();

	guidedDevelopmentPanel = new GuidedDevelopmentPanel(extContext);
	registerAndSubscribeCommand("loadGuidedDevelopment", guidedDevelopmentPanel.loadWebviewPanel.bind(guidedDevelopmentPanel));
	registerAndSubscribeCommand("guidedDevelopment.toggleOutput", guidedDevelopmentPanel.toggleOutput.bind(guidedDevelopmentPanel));
	registerWebviewPanelSerializer(guidedDevelopmentPanel);

	const vscodeEvents = VSCodeEvents.getInstance();
	const basAPI: typeof bas = await vscode.extensions.getExtension("SAPOSS.app-studio-toolkit")?.exports;
	vscodeEvents.setBasAPI(basAPI);

	setSetData(vscodeEvents, vscodeEvents.setData);

	const guideProvider = new GuideViewProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(GuideViewProvider.viewType, guideProvider, {webviewOptions: {retainContextWhenHidden: true}}));
	registerAndSubscribeCommand('guidedDevelopment.refreshCenter', guideProvider.refreshData.bind(guideProvider));

	return managerApi;
}

function registerAndSubscribeCommand(cId: string, cAction: any) {
	extContext.subscriptions.push(vscode.commands.registerCommand(cId, cAction));
}

function registerWebviewPanelSerializer(abstractPanel: AbstractWebviewPanel) {
	vscode.window.registerWebviewPanelSerializer(abstractPanel.viewType, {
		async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state?: any) {
			abstractPanel.setWebviewPanel(webviewPanel, state);
		}
	});
}

export function deactivate() {
	guidedDevelopmentPanel = null;
}

