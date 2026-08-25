import { YeomanUI } from "./yeomanui.js";
import { YouiEvents } from "./youi-events.js";
import yoUiLog from "./utils/log.js";
import lodash from "lodash";
import chalk from "chalk";
import type { Answers } from "inquirer";
import type { YeomanUIQuestions } from "./utils/questionTypes.js";
import { Output } from "./output.js";

const { get, isFunction } = lodash;

export class YouiAdapter {
  private yeomanui: YeomanUI;
  private abortController = new AbortController();

  constructor(
    private readonly youiEvents: YouiEvents,
    private readonly output: Output
  ) {}

  public log() {
    console.log(arguments);
  }

  public setYeomanUI(yeomanui: YeomanUI) {
    this.yeomanui = yeomanui;
    this.log = yoUiLog(this.output, this.yeomanui);
  }

  // --- yeoman-environment v6 adapter contract ---

  get signal(): AbortSignal {
    return this.abortController.signal;
  }

  public resetSignal(): void {
    this.abortController = new AbortController();
  }

  public abort(reason?: unknown): void {
    if (!this.abortController.signal.aborted) {
      this.abortController.abort(reason);
    }
  }

  public onIdle(): Promise<void> {
    return Promise.resolve();
  }

  public async progress<T>(
    fn: (progress: { step: (...args: any[]) => void }) => T | Promise<T>
  ): Promise<T> {
    return fn({ step: () => undefined });
  }

  get colorDiffAdded() {
    return chalk.black.bgGreen;
  }

  get colorDiffRemoved() {
    return chalk.bgRed;
  }

  public colorLines() {
    return "";
  }

  /**
   * @param {Array} questions
   * @param {Function} callback
   */
  public async prompt<T1 extends Answers, T2>(
    questions: YeomanUIQuestions,
    cb?: (res: T1) => T2
  ): Promise<T2> {
    if (this.yeomanui && questions) {
      const result: any = await (this.yeomanui.showPrompt(
        questions
      ) as Promise<T2>);
      if (isFunction(cb)) {
        try {
          return await cb(result); // eslint-disable-line @typescript-eslint/await-thenable
        } catch (err) {
          void this.youiEvents.doGeneratorDone(
            false,
            get(err, "message", "Template Wizard detected an error"),
            "",
            "files"
          );
          return;
        }
      }

      return result;
    }

    return Promise.resolve({} as T2);
  }

  /**
   * Shows a color-based diff of two strings
   *
   * @param {string} actual
   * @param {string} expected
   */
  public diff(): string {
    return "";
  }
}
