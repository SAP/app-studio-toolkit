import * as vscode from "vscode";
import * as path from "path";
import * as _ from "lodash";
import * as fsextra from "fs-extra";
import { IChildLogger } from "@vscode-logging/logger";
import { getClassLogger } from "../logger/logger-wrapper";
import { createFlowPromise, FlowPromise } from "../utils";
import { JSDOM } from "jsdom";

export abstract class AbstractWebviewPanel {
  public viewType: string;
  protected extensionPath: string;
  protected mediaPath: string;
  protected viewTitle: string;
  protected webViewPanel: vscode.WebviewPanel;
  protected viewColumn: vscode.ViewColumn;
  protected focusedKey: string;
  protected htmlFileName: string;
  protected uiOptions: unknown;
  protected flowPromise: FlowPromise<void>;

  protected logger: IChildLogger;
  protected disposables: vscode.Disposable[];

  protected constructor(context: vscode.ExtensionContext) {
    this.extensionPath = context.extensionPath;
    this.mediaPath = path.join(context.extensionPath, "dist", "media");
    this.htmlFileName = "index.html";
    this.logger = getClassLogger("AbstractWebviewPanel");
    this.disposables = [];
  }

  private setViewColumn(uiOptions?: unknown) {
    this.viewColumn = _.get(uiOptions, "viewColumn", vscode.ViewColumn.One);
  }

  protected setFlowPromise(): void {
    this.flowPromise = createFlowPromise<void>();
  }

  public async setWebviewPanel(
    webViewPanel: vscode.WebviewPanel,
    uiOptions?: unknown
  ): Promise<void> {
    this.setFlowPromise();
    this.webViewPanel = webViewPanel;
    this.uiOptions = uiOptions;
    this.setViewColumn(uiOptions);
  }

  public async loadWebviewPanel(uiOptions?: unknown): Promise<void> {
    if (this.webViewPanel && _.isEmpty(uiOptions)) {
      this.webViewPanel.reveal();
    } else {
      this.disposeWebviewPanel();
      this.setViewColumn(uiOptions);
      const webViewPanel = this.createWebviewPanel();
      await this.setWebviewPanel(webViewPanel, uiOptions);
    }
  }

  protected createWebviewPanel(): vscode.WebviewPanel {
    return vscode.window.createWebviewPanel(
      this.viewType,
      this.viewTitle,
      this.viewColumn,
      {
        // Enable javascript in the webview
        enableScripts: true,
        retainContextWhenHidden: true,
        // And restrict the webview to only loading content from our extension's `media` directory.
        localResourceRoots: [vscode.Uri.file(this.mediaPath)],
      }
    );
  }

  protected disposeWebviewPanel(): void {
    const displayedPanel = this.webViewPanel;
    if (displayedPanel) {
      this.dispose();
    }
  }

  protected initWebviewPanel(): void {
    // Set the webview's initial html content
    this.initHtmlContent();

    // Set the context (current panel is focused)
    this.setFocused(this.webViewPanel.active);

    this.webViewPanel.onDidDispose(
      () => this.dispose(),
      null,
      this.disposables
    );

    // Update the content based on view changes
    this.webViewPanel.onDidChangeViewState(
      () => {
        this.setFocused(this.webViewPanel.active);
      },
      null,
      this.disposables
    );
  }

  protected setFocused(focusedValue: boolean): void {
    vscode.commands.executeCommand("setContext", this.focusedKey, focusedValue);
  }

  private cleanFlowPromise() {
    if (this.flowPromise) {
      // resolves promise in case panel is closed manually by an user
      // it is safe to call resolve several times on same promise
      this.flowPromise.state.resolve();
    }
    this.flowPromise = null;
  }

  protected dispose(): void {
    this.setFocused(false);

    // Clean up our resources
    this.webViewPanel.dispose();
    this.webViewPanel = null;

    while (this.disposables.length) {
      const x = this.disposables.pop();
      if (x) {
        x.dispose();
      }
    }

    this.cleanFlowPromise();
  }

  protected async initHtmlContent(): Promise<void> {
    let indexHtml = await fsextra.readFile(
      path.join(this.mediaPath, this.htmlFileName),
      "utf8"
    );
    if (indexHtml) {
      // Local path to main script run in the webview
      const scriptPathOnDisk = vscode.Uri.file(
        path.join(this.mediaPath, path.sep)
      );
      const scriptUri = this.webViewPanel.webview.asWebviewUri(
        scriptPathOnDisk
      );

      const baseUrl = scriptUri.toString();
      const dom = new JSDOM(indexHtml);
      const { document } = dom.window;

      function replaceAttributePaths(elements: any, attributeName: string) {
        elements.forEach((element: any) => {
          const currentAttr = element.getAttribute(attributeName);
          if (currentAttr) {
            element.setAttribute(attributeName, `${baseUrl}/${currentAttr}`);
          }
        });
      }

      const srcElements = document.querySelectorAll("[src]");
      const hrefElements = document.querySelectorAll("[href]");

      replaceAttributePaths(srcElements, "src");
      replaceAttributePaths(hrefElements, "href");

      indexHtml = dom.serialize();
    }
    this.webViewPanel.webview.html = indexHtml;
  }
}
