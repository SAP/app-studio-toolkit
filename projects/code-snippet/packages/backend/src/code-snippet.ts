import _ from "lodash";
import * as inquirer from "inquirer";
import { AppLog } from "./app-log";
import { AppEvents } from "./app-events";
import { IRpc } from "@sap-devx/webview-rpc/out.ext/rpc-common";
import Generator = require("yeoman-generator");
import { IChildLogger } from "@vscode-logging/logger";
import TerminalAdapter = require("yeoman-environment/lib/adapter");
import { AnalyticsWrapper } from "./usage-report/usage-analytics-wrapper";
import messages from "./messages";
import { State } from "./utils";

export class CodeSnippet {
  private static funcReplacer(key: any, value: any) {
    return _.isFunction(value) ? "__Function" : value;
  }

  private readonly uiOptions: any;
  private readonly rpc: IRpc;
  private readonly appEvents: AppEvents;
  private readonly outputChannel: AppLog;
  private readonly logger: IChildLogger;
  private gen: Generator | undefined;
  private currentQuestions: TerminalAdapter.Questions<any>;
  private snippetName: string;
  private readonly customQuestionEventHandlers: Map<
    string,
    // eslint-disable-next-line @typescript-eslint/ban-types -- legacy code
    Map<string, Function>
  >;
  private readonly flowState: State<void>;
  // TODO: the constructor invocation is getting too large and not readable
  // looks like we need an options object / config object
  constructor(
    rpc: IRpc,
    appEvents: AppEvents,
    outputChannel: AppLog,
    logger: IChildLogger,
    flowState: State<void>,
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types -- legacy code
    uiOptions: any
  ) {
    this.rpc = rpc;
    if (!this.rpc) {
      throw new Error("rpc must be set");
    }
    this.snippetName = "";
    this.appEvents = appEvents;
    this.outputChannel = outputChannel;
    this.logger = logger;
    this.rpc.setResponseTimeout(3600000);
    this.rpc.registerMethod({
      func: this.receiveIsWebviewReady,
      thisArg: this,
    });
    this.rpc.registerMethod({ func: this.applyCode, thisArg: this });
    this.rpc.registerMethod({ func: this.evaluateMethod, thisArg: this });
    this.rpc.registerMethod({ func: this.toggleOutput, thisArg: this });
    this.rpc.registerMethod({ func: this.logError, thisArg: this });
    this.rpc.registerMethod({ func: this.getState, thisArg: this });
    this.rpc.registerMethod({ func: this.executeCommand, thisArg: this });

    this.currentQuestions = {};
    this.uiOptions = uiOptions;
    this.customQuestionEventHandlers = new Map();
    // this promise will be resolved when code-snippet flow ends successfully
    // this promise will be rejected when code-snippet flow fails
    this.flowState = flowState;
  }

  private async getState() {
    let state = _.omit(this.uiOptions, ["snippet"]);
    try {
      // valiation for rpc
      JSON.stringify(state);
    } catch (error) {
      // save stateError and remove contributorInfo.context
      state = _.omit(state, ["contributorInfo.context"]);
      _.set(state, "stateError", true);
    }

    return state;
  }

  private async getDefaultAnswers(): Promise<any> {
    const answers = {};
    const questions: any[] = await this.createCodeSnippetQuestions();

    for (const question of questions) {
      if (_.isFunction(question.default)) {
        answers[question.name] = await question.default(answers);
      } else {
        answers[question.name] = question.default;
      }
    }

    return _.defaults(this.uiOptions.contributorInfo.snippetArgs, answers);
  }

  public async executeCodeSnippet(answers?: unknown): Promise<any> {
    answers = _.isNil(answers) ? await this.getDefaultAnswers() : answers;

    if (_.isEmpty(answers)) {
      const errorMessage = this.logError(this.uiOptions.messages.noResponse);
      return Promise.reject(errorMessage);
    }
    await this.applyCode(answers);
  }

  public registerCustomQuestionEventHandler(
    questionType: string,
    methodName: string,
    // eslint-disable-next-line @typescript-eslint/ban-types -- legacy code
    handler: Function
  ): void {
    // eslint-disable-next-line @typescript-eslint/ban-types -- legacy code
    let entry: Map<string, Function> = this.customQuestionEventHandlers.get(
      questionType
    );
    if (entry === undefined) {
      this.customQuestionEventHandlers.set(questionType, new Map());
      entry = this.customQuestionEventHandlers.get(questionType);
    }
    entry.set(methodName, handler);
  }

  private executeCommand(id: string, ...args: any[]): void {
    this.appEvents.executeCommand(id, ...args);
  }

  private logError(error: any, prefixMessage?: string) {
    let errorMessage = this.getErrorInfo(error);
    if (prefixMessage) {
      errorMessage = `${prefixMessage}\n${errorMessage}`;
    }

    this.logger.error(errorMessage);
    return errorMessage;
  }

  private async applyCode(answers: any) {
    this.snippetName = this.uiOptions.messages.title;
    let showDoneMessage = true;
    try {
      const we: any = await this.createCodeSnippetWorkspaceEdit(answers);
      if (!we) {
        await this.appEvents.doClose();
        showDoneMessage = false;
      } else {
        await this.appEvents.doApply(we);
        showDoneMessage = true;
      }
      this.onSuccess(showDoneMessage, this.snippetName);
    } catch (error) {
      this.onFailure(showDoneMessage, this.snippetName, error);
    }
  }

  /**
   *
   * @param answers - partial answers for the current prompt -- the input parameter to the method to be evaluated
   * @param method
   */
  private async evaluateMethod(
    params: any[],
    questionName: string,
    methodName: string
  ): Promise<any> {
    try {
      if (!_.isEmpty(this.currentQuestions)) {
        const relevantQuestion: any = _.find(
          this.currentQuestions,
          (question) => {
            return _.get(question, "name") === questionName;
          }
        );
        if (relevantQuestion) {
          const guiType = _.get(
            relevantQuestion,
            "guiOptions.type",
            relevantQuestion.guiType
          );
          // eslint-disable-next-line @typescript-eslint/ban-types -- legacy code
          const customQuestionEventHandler: Function = this.getCustomQuestionEventHandler(
            guiType,
            methodName
          );
          return _.isUndefined(customQuestionEventHandler)
            ? await relevantQuestion[methodName].apply(this.gen, params)
            : await customQuestionEventHandler.apply(this.gen, params);
        }
      }
    } catch (error) {
      const questionInfo = messages.couldNotUpdate(
        methodName,
        questionName,
        _.get(this.gen, "options.namespace")
      );
      const errorMessage = this.logError(error, questionInfo);
      this.onFailure(true, this.snippetName, errorMessage);
    }
  }

  private async receiveIsWebviewReady() {
    try {
      const questions: any[] = await this.createCodeSnippetQuestions();
      this.currentQuestions = questions;
      const normalizedQuestions = this.normalizeFunctions(questions);
      AnalyticsWrapper.updateSnippetStarted(
        this.uiOptions.messages.title,
        this.logger
      );
      const response: any = await this.rpc.invoke("showPrompt", [
        normalizedQuestions,
      ]);
      await this.executeCodeSnippet(response);
    } catch (error) {
      const errorMessage = this.logError(error, messages.couldNotInitialize);
      this.onFailure(true, this.snippetName, errorMessage);
    }
  }

  private toggleOutput(): boolean {
    return this.outputChannel.showOutput();
  }

  public async showPrompt(
    questions: TerminalAdapter.Questions<any>
  ): Promise<inquirer.Answers> {
    this.currentQuestions = questions;
    const mappedQuestions: TerminalAdapter.Questions<any> = this.normalizeFunctions(
      questions
    );
    if (_.isEmpty(mappedQuestions)) {
      return {};
    }

    const answers = await this.rpc.invoke("showPrompt", [mappedQuestions]);
    return answers;
  }

  private getCustomQuestionEventHandler(
    questionType: string,
    methodName: string
    // eslint-disable-next-line @typescript-eslint/ban-types -- legacy code
  ): Function {
    // eslint-disable-next-line @typescript-eslint/ban-types -- legacy code
    const entry: Map<string, Function> = this.customQuestionEventHandlers.get(
      questionType
    );
    if (entry !== undefined) {
      return entry.get(methodName);
    }
  }

  private onSuccess(showDoneMessage: boolean, snippetName: string) {
    const message = `'${snippetName}' snippet has been created.`;
    this.logger.debug("done running code-snippet! " + message);
    AnalyticsWrapper.updateSnippetEnded(snippetName, true, this.logger);
    if (showDoneMessage) {
      this.appEvents.doSnippeDone(true, message);
    }
    this.flowState.resolve();
  }

  private async onFailure(
    showDoneMessage: boolean,
    snippetrName: string,
    error: any
  ) {
    const messagePrefix = `${snippetrName} snippet failed.`;
    const errorMessage: string = this.logError(error, messagePrefix);
    AnalyticsWrapper.updateSnippetEnded(
      snippetrName,
      false,
      this.logger,
      errorMessage
    );
    if (showDoneMessage) {
      this.appEvents.doSnippeDone(false, errorMessage);
    }
    this.flowState.reject(error);
  }

  private getErrorInfo(error: any = "") {
    if (_.isString(error)) {
      return error;
    }

    const name = _.get(error, "name", "");
    const message = _.get(error, "message", "");
    const stack = _.get(error, "stack", "");

    return `name: ${name}\n message: ${message}\n stack: ${stack}\n string: ${error.toString()}\n`;
  }

  private async createCodeSnippetQuestions(): Promise<any[]> {
    const snippet = this.uiOptions.snippet;

    let questions: any[] = [];

    if (snippet && snippet.getQuestions) {
      questions = await snippet.getQuestions();
    }

    return questions;
  }

  private async createCodeSnippetWorkspaceEdit(answers: any): Promise<any[]> {
    const snippet = this.uiOptions.snippet;

    let we: any = undefined;

    if (snippet && snippet.getWorkspaceEdit) {
      we = await snippet.getWorkspaceEdit(answers);
    }
    if (!we) {
      this.logger.debug(this.snippetName + " WorkspaceEdit is undefined");
    }

    return we;
  }

  /**
   *
   * @param questions
   * returns a deep copy of the original questions, but replaces Function properties with a placeholder
   *
   * Functions are lost when being passed to client (using JSON.Stringify)
   * Also functions cannot be evaluated on client)
   */
  private normalizeFunctions(
    questions: TerminalAdapter.Questions<any>
  ): TerminalAdapter.Questions<any> {
    this.addCustomQuestionEventHandlers(questions);
    return JSON.parse(JSON.stringify(questions, CodeSnippet.funcReplacer));
  }

  private addCustomQuestionEventHandlers(
    questions: TerminalAdapter.Questions<any>
  ): void {
    for (const question of questions as any[]) {
      const guiType = _.get(question, "guiOptions.type", question.guiType);
      const questionHandlers = this.customQuestionEventHandlers.get(guiType);
      if (questionHandlers) {
        questionHandlers.forEach((handler, methodName) => {
          question[methodName] = handler;
        });
      }
    }
  }
}
