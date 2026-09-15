import * as path from "path";
import { filter, find, get, has, isEmpty, isFunction, isUndefined, map, pick } from "lodash";
import { IRpc } from "@sap-devx/webview-rpc/out.ext/rpc-common";
import { ConfiguredTask, TaskEditorContributionAPI, TaskUserInput } from "@sap_oss/task_contrib_types";
import { AppEvents } from "./app-events";
import { AnalyticsWrapper } from "./usage-report/usage-analytics-wrapper";
import { getClassLogger } from "./logger/logger-wrapper";
import { messages } from "./i18n/messages";
import { getExtensionPath } from "./extension";
import { getConfiguredTasksFromCache } from "./services/tasks-provider";
import { combineValidationFunctions, convertContributedPropertiesToQuestions } from "./services/questions";
import { TaskQuestion, validationFunction } from "./services/definitions";

const datauri = require("datauri/sync");

const LOGGER_CLASS_NAME = "Task Editor";

type pathFieldHandler = (...params: string[]) => Promise<string>;

export class TaskEditor {
  private readonly gen: Generator | undefined;
  private taskFrontendMirror: TaskQuestion[] = [];
  private changed = false;
  private readonly index = -1;
  private readonly wsFolder = "";
  private readonly intent: string;
  private task: ConfiguredTask;
  private readonly taskEditorContributor: TaskEditorContributionAPI<ConfiguredTask> | undefined;
  private readonly taskImage: string;
  private taskLabel: string;
  private readonly extensionName: string;
  private readonly customQuestionEventHandlers: Map<string, Map<string, pathFieldHandler>>;

  private static funcReplacer(key: any, value: any) {
    return isFunction(value) ? "__Function" : value;
  }

  // private normalizeFunctions(questions: Environment.Adapter.Questions<any>): Environment.Adapter.Questions<any> {
  private static normalizeFunctions(questions: any): any {
    return JSON.parse(JSON.stringify(questions, TaskEditor.funcReplacer));
  }

  public isTaskChanged(): boolean {
    return this.changed;
  }

  public getTask(): ConfiguredTask {
    return {
      type: this.task.type,
      label: this.taskLabel,
      changed: this.changed,
    };
  }

  public getTaskWsFolder(): string {
    return this.wsFolder;
  }

  constructor(
    private readonly rpc: IRpc,
    private readonly appEvents: AppEvents,
    task: ConfiguredTask,
  ) {
    this.index = task.__index;
    this.intent = task.__intent;
    this.wsFolder = task.__wsFolder;
    this.taskLabel = task.label;
    this.extensionName = task.__extensionName;

    this.task = { ...task };
    delete this.task.__index;
    delete this.task.__intent;
    delete this.task.__wsFolder;
    delete this.task.__extensionName;

    this.rpc.setResponseTimeout(2000);

    this.rpc.registerMethod({
      func: this.onFrontendReady,
      name: "onFrontendReady",
      thisArg: this,
    });
    this.rpc.registerMethod({
      func: this.setAnswers,
      name: "setAnswers",
      thisArg: this,
    });
    this.rpc.registerMethod({
      func: this.evaluateMethod,
      name: "evaluateMethod",
      thisArg: this,
    });
    this.rpc.registerMethod({
      func: this.saveTask,
      name: "saveTask",
      thisArg: this,
    });
    this.rpc.registerMethod({
      func: this.executeTask,
      name: "executeTask",
      thisArg: this,
    });

    this.taskEditorContributor = this.appEvents.getTasksEditorContributor(this.task.type);
    this.taskImage = this.taskEditorContributor !== undefined ? this.taskEditorContributor.getTaskImage() : "";
    this.customQuestionEventHandlers = new Map();
  }

  public registerCustomQuestionEventHandler(questionType: string, methodName: string, handler: pathFieldHandler): void {
    if (!this.customQuestionEventHandlers.has(questionType)) {
      this.customQuestionEventHandlers.set(questionType, new Map());
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- verified above
    this.customQuestionEventHandlers.get(questionType)!.set(methodName, handler);
  }

  private async evaluateMethod(params: any[], questionName: string, methodName: string): Promise<any> {
    try {
      const evaluatedQuestions = this.taskFrontendMirror;
      if (!isEmpty(evaluatedQuestions)) {
        const relevantQuestion: any = find(evaluatedQuestions, (question) => {
          return get(question, "name") === questionName;
        });
        if (relevantQuestion) {
          const guiType = get(relevantQuestion, "guiOptions.type", relevantQuestion.guiType);
          const customQuestionEventHandler =
            guiType === undefined ? undefined : this.getCustomQuestionEventHandler(guiType, methodName);
          return isUndefined(customQuestionEventHandler)
            ? await relevantQuestion[methodName].apply(this.gen, params)
            : await customQuestionEventHandler.apply(this.gen, params);
        }

        getClassLogger(LOGGER_CLASS_NAME).error(
          messages.METHOD_NOT_FOUND(methodName, questionName, JSON.stringify(params)),
        );
      }
    } catch (error) {
      getClassLogger(LOGGER_CLASS_NAME).error(
        messages.EVALUATED_METHOD_FAILURE(methodName, questionName, JSON.stringify(params), error as Error),
      );
    }

    return undefined;
  }

  private getCustomQuestionEventHandler(questionType: string, methodName: string): pathFieldHandler | undefined {
    return this.customQuestionEventHandlers.get(questionType)?.get(methodName);
  }

  public async saveTask() {
    // report telemetry event
    AnalyticsWrapper.reportTaskSave({
      __wsFolder: this.wsFolder,
      __intent: this.intent,
      __extensionName: this.extensionName,
      ...this.task,
    });

    const editedTask = { ...this.task };
    delete editedTask.__image;
    if (this.taskEditorContributor !== undefined && isFunction(this.taskEditorContributor.onSave)) {
      await this.taskEditorContributor.onSave(editedTask);
    }
    await this.appEvents.updateTaskInConfiguration(this.wsFolder, editedTask, this.index);
    this.changed = false;
    this.taskLabel = this.task.label;
  }

  private async executeTask() {
    // report telemetry event
    AnalyticsWrapper.reportTaskExecuteEditor({
      __wsFolder: this.wsFolder,
      __intent: this.intent,
      __extensionName: this.extensionName,
      ...this.task,
    });
    // force to propogate `__wsFolder` property in favor of `npm` task
    return this.appEvents.executeTask({ ...this.task, __wsFolder: this.wsFolder });
  }

  private async setAnswers(state: any): Promise<void> {
    // remove readonly fields from the answer
    const notReadonlyProperties = filter(
      this.taskFrontendMirror,
      // readonly question must have guiOptions property with { type: "label"} }
      (_) => _.guiOptions?.type !== "label",
    );
    const notReadonlyPropertiesNames = map(notReadonlyProperties, (_) => _.name);
    const answers = pick(state.answers, notReadonlyPropertiesNames);

    this.updateTaskFrontendMirror(answers);

    if (this.taskEditorContributor === undefined) {
      this.task = { ...this.task, ...answers };
    } else {
      this.task = await this.taskEditorContributor.updateTask(this.task, answers);
    }
    this.changed = true;
    return this.passTaskToFrontend(true);
  }

  private updateTaskFrontendMirror(answers: TaskUserInput): void {
    for (const question of this.taskFrontendMirror) {
      if (has(answers, question.name)) {
        question.default = answers[question.name];
      }
    }
  }

  private isTaskFrontendMirrorChanged(updatedTask: TaskQuestion[]): boolean {
    if (updatedTask.length !== this.taskFrontendMirror.length) {
      return true;
    }
    for (const [key, item] of updatedTask.entries()) {
      if (item.name !== this.taskFrontendMirror[key].name || item.default !== this.taskFrontendMirror[key].default) {
        return true;
      }
    }
    return false;
  }

  private convertTaskToFormInfo(): TaskQuestion[] {
    const taskFields = filter(
      Object.keys(this.task),
      (_) => _ !== "type" && _ !== "taskType" && typeof this.task[_] === "string",
    );
    let formFields: any[] = [];
    for (const taskField of taskFields) {
      const formField = {
        name: taskField,
        message: taskField,
        type: "input",
        default: this.task[taskField],
      };
      formFields = formFields.concat(formField);
    }
    return formFields;
  }

  private getTaskExecutionImage(): string {
    const image = this.intent === "Deploy" ? "rocket.svg" : "general_light.svg";
    return getImage(path.join(getExtensionPath(), "resources", image));
  }

  private setLabelValidator(frontendTaskProperties: any[]): void {
    const labelProperty = find(frontendTaskProperties, (_) => _["name"] === "label");
    if (labelProperty !== undefined) {
      labelProperty["validate"] = combineValidationFunctions(
        labelProperty["validate"],
        getIsLabelUniqueFunction(this.index),
      );
    }
  }

  private convertTaskToFrontend(): TaskQuestion[] {
    let frontendTask: TaskQuestion[];
    if (this.taskEditorContributor === undefined) {
      // if contributor is undefined we use basic conversion
      frontendTask = this.convertTaskToFormInfo();
    } else {
      // get form properties from contributor
      const contributedProperties = this.taskEditorContributor.convertTaskToFormProperties(this.task);

      // convert properties to gui inquirer format
      frontendTask = convertContributedPropertiesToQuestions(this.task, contributedProperties, this.appEvents);
    }
    return frontendTask;
  }

  private async onFrontendReady(): Promise<void> {
    return this.passTaskToFrontend();
  }

  // this method is called in 2 cases:
  // 1. when frontend is created and ready to receive data (refresh property not used)
  // 2. after user's input (refresh property has to be `true`) that can have side effects on the form
  private async passTaskToFrontend(refresh = false): Promise<void> {
    // on first call contributor is initialized
    if (!refresh && this.taskEditorContributor !== undefined) {
      await this.taskEditorContributor.init(this.wsFolder, this.task);
    }

    // convert task to the form properties
    const taskFrontendInfo = this.convertTaskToFrontend();

    // if it's the case of refresh and task frontend mirror didn't change (no side effects)
    // we skip frontend refresh
    if (refresh && !this.isTaskFrontendMirrorChanged(taskFrontendInfo)) {
      return;
    }

    // extend label validator with the check of label's uniqueness
    this.setLabelValidator(taskFrontendInfo);

    // cache task frontend properties
    this.taskFrontendMirror = taskFrontendInfo;

    // normalize form properties, serializing functions
    const normalizedTaskFrontendInfo = TaskEditor.normalizeFunctions(taskFrontendInfo);

    const taskExecImage = this.getTaskExecutionImage();

    const taskWithMetadata = {
      ...this.task,
      content: normalizedTaskFrontendInfo,
      taskExecutionImage: taskExecImage,
      taskImage: this.taskImage,
      taskIntent: this.getExecutionIntent(),
    };

    return this.rpc.invoke("setTask", [taskWithMetadata]);
  }

  private getExecutionIntent(): string {
    return this.intent === "Build" || this.intent === "Deploy" ? this.intent : "Run";
  }
}

function getImage(imagePath: string): string {
  let image = "";
  try {
    image = datauri(imagePath).content;
  } catch (error) {
    getClassLogger(LOGGER_CLASS_NAME).error(messages.GET_IMAGE_FAILURE(imagePath, error as Error));
  }
  return image;
}

function getIsLabelUniqueFunction(taskIndex: number): validationFunction {
  return async function (value: string): Promise<string | boolean> {
    const tasks = getConfiguredTasksFromCache();
    return find(tasks, (_) => _.label === value && taskIndex !== _.__index) ? messages.LABEL_IS_NOT_UNIQUE() : true;
  };
}
