import _ from "lodash";
import * as path from "path";
import * as os from "os";
import * as vscode from "vscode";
import { CodeSnippet } from "../code-snippet";
import { RpcExtension } from "@sap-devx/webview-rpc/out.ext/rpc-extension";
import { AppLog } from "../app-log";
import backendMessages from "../messages";
import { OutputChannelLog } from "../output-channel-log";
import { AppEvents } from "../app-events";
import { VSCodeEvents } from "../vscode-events";
import { AbstractWebviewPanel } from "./AbstractWebviewPanel";
import { Contributors } from "../contributors";
import { getWebviewRpcLibraryLogger } from "../logger/logger-wrapper";
import { IChildLogger } from "@vscode-logging/logger";

export class CodeSnippetPanel extends AbstractWebviewPanel {
  public static CODE_SNIPPET = "Code Snippet";
  private static channel: vscode.OutputChannel;

  // uiOptions coming from webview panel serializer looks like: {contributorInfo: {...}, ...}
  private getContribInfoFrom(uiOptions?: unknown): unknown {
    return _.get(uiOptions, "contributorInfo", uiOptions);
  }

  public toggleOutput(): void {
    this.outputChannel.showOutput();
  }

  public async loadWebviewPanel(uiOptions?: unknown): Promise<void> {
    const contributorInfo = this.getContribInfoFrom(uiOptions);
    const snippet = await this.prepareSnippet(contributorInfo);

    if (_.get(uiOptions, "isNonInteractive", false)) {
      this.setFlowPromise();

      const codeSnippet = this.createCodeSnippet(
        this.messages,
        this.logger,
        snippet,
        uiOptions
      );
      await codeSnippet.executeCodeSnippet();
    } else {
      await super.loadWebviewPanel(uiOptions);
    }

    return this.flowPromise.promise;
  }

  private createCodeSnippet(
    messages: unknown,
    logger: IChildLogger,
    snippet: unknown,
    contributorInfo: unknown,
    webViewPanel?: vscode.WebviewPanel
  ): CodeSnippet {
    let rpc;
    if (_.get(contributorInfo, "isNonInteractive")) {
      rpc = {
        setResponseTimeout: () => false,
        registerMethod: () => false,
        invoke: () => Promise.resolve(false),
      };
    } else {
      rpc = new RpcExtension(
        webViewPanel?.webview,
        getWebviewRpcLibraryLogger()
      );
    }
    this.outputChannel = new OutputChannelLog(_.get(messages, "channelName"));
    const vscodeEvents: AppEvents = new VSCodeEvents(webViewPanel);

    return new CodeSnippet(
      rpc,
      vscodeEvents,
      this.outputChannel,
      logger,
      this.flowPromise.state,
      {
        messages,
        snippet,
        contributorInfo,
      }
    );
  }

  private validateSnippet(snippet: unknown, contributorInfo: unknown) {
    if (_.isNil(snippet)) {
      const errorMessage = `'${_.get(
        contributorInfo,
        "contributorId"
      )}' snippet could not be found.`;
      this.logger.error(errorMessage);
      throw new Error(errorMessage);
    }
  }

  private async prepareSnippet(contributorInfo: unknown): Promise<any> {
    const snippet = await this.contributors.getSnippet(contributorInfo);
    this.validateSnippet(snippet, contributorInfo);
    this.messages = _.assign({}, backendMessages, snippet.getMessages());
    return snippet;
  }

  public async setWebviewPanel(
    webViewPanel: vscode.WebviewPanel,
    uiOptions?: unknown
  ): Promise<void> {
    super.setWebviewPanel(webViewPanel, uiOptions);

    const contributorInfo = this.getContribInfoFrom(uiOptions);
    const snippet = await this.prepareSnippet(contributorInfo);

    this.codeSnippet = this.createCodeSnippet(
      this.messages,
      this.logger,
      snippet,
      uiOptions,
      webViewPanel
    );

    this.codeSnippet.registerCustomQuestionEventHandler(
      "file-browser",
      "getFilePath",
      this.showOpenFileDialog.bind(this)
    );
    this.codeSnippet.registerCustomQuestionEventHandler(
      "folder-browser",
      "getPath",
      this.showOpenFolderDialog.bind(this)
    );

    this.initWebviewPanel();
  }

  public static getOutputChannel(channelName: string): vscode.OutputChannel {
    if (!this.channel) {
      this.channel = vscode.window.createOutputChannel(
        `${CodeSnippetPanel.CODE_SNIPPET}.${channelName}`
      );
    }

    return this.channel;
  }

  private codeSnippet: CodeSnippet;
  private messages: any;
  private outputChannel: AppLog;
  private readonly contributors: Contributors;

  constructor(context: vscode.ExtensionContext) {
    super(context);
    this.viewType = "codeSnippet";
    this.viewTitle = CodeSnippetPanel.CODE_SNIPPET;
    this.focusedKey = "codeSnippet.Focused";
    this.contributors = new Contributors();
  }

  private async showOpenFileDialog(currentPath: string): Promise<string> {
    return await this.showOpenDialog(currentPath, true);
  }

  private async showOpenFolderDialog(currentPath: string): Promise<string> {
    return await this.showOpenDialog(currentPath, false);
  }

  private async showOpenDialog(
    currentPath: string,
    canSelectFiles: boolean
  ): Promise<string> {
    const canSelectFolders = !canSelectFiles;

    let uri;
    try {
      uri = vscode.Uri.file(currentPath);
    } catch (e) {
      uri = vscode.Uri.file(path.join(os.homedir()));
    }

    try {
      const filePath = await vscode.window.showOpenDialog({
        canSelectFiles,
        canSelectFolders,
        defaultUri: uri,
      });
      return _.get(filePath, "[0].fsPath", currentPath);
    } catch (error) {
      return currentPath;
    }
  }

  public disposeWebviewPanel(): void {
    super.disposeWebviewPanel();
    this.codeSnippet = null;
  }

  public initWebviewPanel(): void {
    super.initWebviewPanel();
    this.webViewPanel.title = this.messages.title;
  }
}
