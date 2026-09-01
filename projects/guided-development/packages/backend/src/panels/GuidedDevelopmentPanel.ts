import * as _ from 'lodash';
import * as vscode from 'vscode';
import { GuidedDevelopment } from "../guided-development";
import { RpcExtension } from '@sap-devx/webview-rpc/out.ext/rpc-extension';
import { AppLog } from "../app-log";
import backendMessages from "../messages";
import { OutputChannelLog } from '../output-channel-log';
import { AppEvents } from "../app-events";
import { VSCodeEvents } from '../vscode-events';
import { AbstractWebviewPanel } from './AbstractWebviewPanel';
import { Contributors } from "../contributors";
import { IInternalCollection } from "../Collection";
import { IconList } from '../types';

export class GuidedDevelopmentPanel extends AbstractWebviewPanel {
	public static GUIDED_DEVELOPMENT = "Guided Development";

	private static channel: vscode.OutputChannel;
	private uiOptions: any;

	public toggleOutput() {
		this.outputChannel.showOutput();
	}

	public loadWebviewPanel(uiOptions?: any) {
		if (this.webViewPanel && JSON.stringify(uiOptions)===JSON.stringify(this.uiOptions)) {
			this.webViewPanel.reveal(undefined, true);
		} else {
			super.loadWebviewPanel(uiOptions);
		}
	}

	public setWebviewPanel(webViewPanel: vscode.WebviewPanel, uiOptions?: any) {
		super.setWebviewPanel(webViewPanel);
		if (uiOptions) {
			this.uiOptions = uiOptions;
		}

		this.collections = Contributors.getInstance().getCollections();

		this.messages = backendMessages;
		let renderCollections: IInternalCollection[] = [];
		if (this.uiOptions && this.uiOptions.renderType) {
			this.messages = {
				channelName: "GuidedDev",
				title: this.uiOptions.title,
				description: this.uiOptions.description,
				noResponse: "No response received.",
				collectionadditionalinfo: this.uiOptions.additionalInfo
			};
			this.collections.forEach(element => {
				if (this.uiOptions.renderType === "collection" && element.id === this.uiOptions.id) {
					this.messages.collectionadditionalinfo = element.additionalInfo;
					let iconInfo = IconList[this.messages.collectionadditionalinfo?.iconCode];
					if (iconInfo && iconInfo.iconName) {
						this.messages.collectionadditionalinfo.iconName = iconInfo.iconName;
						this.messages.collectionadditionalinfo.iconLabel = iconInfo.iconLabel;
					}
					renderCollections.push(element);
				}
			});
		} else {
			renderCollections = this.collections;
		}

		const rpc = new RpcExtension(this.webViewPanel.webview);
		this.outputChannel = new OutputChannelLog(this.messages.channelName);
		const vscodeEvents: AppEvents = VSCodeEvents.getInstance();
		this.guidedDevelopment = new GuidedDevelopment(rpc, 
			vscodeEvents, 
			this.outputChannel, 
			this.logger,
			this.messages,
			renderCollections,
			this.uiOptions
		);
		Contributors.getInstance().registerOnChangedCallback(this.guidedDevelopment, this.guidedDevelopment.setCollections);

		this.initWebviewPanel();
	}

	public static getOutputChannel(channelName: string): vscode.OutputChannel {
		if (!this.channel) {
			this.channel = vscode.window.createOutputChannel(`${GuidedDevelopmentPanel.GUIDED_DEVELOPMENT}.${channelName}`);
		}

		return this.channel;
	}

	private guidedDevelopment: GuidedDevelopment;
	private collections: Array<IInternalCollection>;
	private messages: any;
	private outputChannel: AppLog;

	public constructor(context: vscode.ExtensionContext) {
		super(context);
		this.viewType = "guidedDevelopment";
		this.viewTitle = GuidedDevelopmentPanel.GUIDED_DEVELOPMENT;
		this.focusedKey = "guidedDevelopment.Focused";
	}

	public disposeWebviewPanel() {
		super.disposeWebviewPanel();
		this.guidedDevelopment = null;
	}

	public initWebviewPanel() {
		super.initWebviewPanel();
		this.webViewPanel.title = this.messages.title;
	}
}
