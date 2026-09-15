import * as vscode from "vscode";
import * as fsextra from "fs-extra";
import * as _ from "lodash";
import { parse, stringify } from "comment-json";

export class ConfigHelper {
  public static async readFile(targetFilePath: string): Promise<any> {
    let content = "{}";
    try {
      content = await fsextra.readFile(targetFilePath, ConfigHelper.UTF8);
    } catch (e) {
      // ignore, probably file or folder is missing
    }
    try {
      return _.merge(parse(content), ConfigHelper.getDefaultContent());
    } catch (e: any) {
      vscode.window.showErrorMessage(e.message);
      return Promise.reject();
    }
  }

  public static getString(configurations: any[]): string {
    return stringify(configurations, undefined, "  ");
  }

  public static async getRange(uri: vscode.Uri): Promise<vscode.Range> {
    let textRange;
    try {
      const doc = await vscode.workspace.openTextDocument(uri);
      const firstLine = doc.lineAt(0);
      const lastLine = doc.lineAt(doc.lineCount - 1);
      textRange = new vscode.Range(firstLine.range.start, lastLine.range.end);
    } catch (e) {
      // probably file is missing
      textRange = new vscode.Range(
        new vscode.Position(0, 0),
        new vscode.Position(0, 0)
      );
    }
    return textRange;
  }

  private static readonly UTF8: string = "utf8";
  private static readonly DEFAULT_LAUNCH: any = {
    version: "0.2.0",
    configurations: [],
  };

  private static getDefaultContent(): any {
    return ConfigHelper.DEFAULT_LAUNCH;
  }
}
