import * as vscode from 'vscode';
import * as _ from 'lodash';
import { Contributors } from '../contributors';
export default class GuideViewProvider implements vscode.WebviewViewProvider {

	public static readonly viewType = 'guide.sapAllGuidesViewSection';

	private _view?: vscode.WebviewView;

	constructor(
		private readonly _extensionUri: vscode.Uri,
	) { }

	public resolveWebviewView(
		webviewView: vscode.WebviewView,
		context: vscode.WebviewViewResolveContext,
		_token: vscode.CancellationToken,
	) {
		this._view = webviewView;

		webviewView.webview.options = {
			// Allow scripts in the webview
			enableScripts: true,

			localResourceRoots: [
				this._extensionUri
			]
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		webviewView.webview.onDidReceiveMessage(data => {
			switch (data.type) {
				case 'guideSelected':
					{
						vscode.commands.executeCommand('loadGuidedDevelopment', data.value);
						break;
					}
				case 'onInitialized':
					{
						this.refreshData(data.value.tutorials);
						break;
					}
			}
		}, this);
	}

	public refreshData(currentGuides?: any[]) {
		let tutorials = Contributors.getInstance().getGroupInfo();
		if (currentGuides && _.isEqual(currentGuides, tutorials)) return;

		if (this._view) {
			this._view.webview.postMessage({type: 'refreshData', data: {items: tutorials}});
		}
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		// Get the local path to main script and stylesheet run in the webview, then convert it to a uri we can use in the webview.
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'center', 'main.js'));
		const styleMainUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'center', 'main.css'));
		const codeIconStyleUri = webview.asWebviewUri(vscode.Uri.joinPath(this._extensionUri, 'resources', 'center', 'codicon.css'));

		// Use a nonce to only allow a specific script to be run.
		const nonce = getNonce();

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<meta http-equiv="Content-Security-Policy" content="font-src ${webview.cspSource}; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${styleMainUri}" rel="stylesheet">
				<link rel="stylesheet" href="${codeIconStyleUri}">

				<title>Guide List</title>
			</head>
			<body>
				<div tabindex="0">
					<ul class="guide-list">
					</ul>
				</div>

				<script nonce="${nonce}" src="${scriptUri}" />
			</body>
			</html>`;
	}
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}
