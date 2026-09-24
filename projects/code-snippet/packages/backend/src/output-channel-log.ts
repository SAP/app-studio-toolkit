import { AppLog } from "./app-log";
import { CodeSnippetPanel } from "./panels/CodeSnippetPanel";
import stripAnsi = require("strip-ansi");

export class OutputChannelLog implements AppLog {
  public constructor(private readonly channelName: string) {}

  public log(value: string): void {
    this.appendLine(value);
  }

  public writeln(value: string): void {
    this.appendLine(value);
  }

  public create(value: string): void {
    this.appendLine(value);
  }

  public force(value: string): void {
    this.appendLine(value);
  }

  public conflict(value: string): void {
    this.appendLine(value);
  }

  public identical(value: string): void {
    this.appendLine(value);
  }

  public skip(value: string): void {
    this.appendLine(value);
  }
  public showOutput(): boolean {
    CodeSnippetPanel.getOutputChannel(this.channelName).show();
    return true;
  }

  private appendLine(value: string) {
    CodeSnippetPanel.getOutputChannel(this.channelName).appendLine(
      stripAnsi(value)
    );
  }
}
