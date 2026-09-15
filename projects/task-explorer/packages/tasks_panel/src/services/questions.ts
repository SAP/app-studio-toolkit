import { isFunction, has, map } from "lodash";
import { ConfiguredTask, FormProperty } from "@sap_oss/task_contrib_types";
import { GuiOptions, TaskQuestion, validationFunction } from "./definitions";
import { AppEvents } from "../app-events";
import { messages } from "../i18n/messages";

export function convertContributedPropertiesToQuestions(
  task: ConfiguredTask,
  properties: FormProperty[],
  getPropertyDescription: Pick<AppEvents, "getTaskPropertyDescription">,
): TaskQuestion[] {
  return map(properties, (property, index) =>
    convertContributedPropertyToQuestion(task, property, getPropertyDescription, index),
  );
}

function convertContributedPropertyToQuestion(
  task: ConfiguredTask,
  formProperty: FormProperty,
  taskInfo: Pick<AppEvents, "getTaskPropertyDescription">,
  index: number,
): TaskQuestion {
  const taskProperty = getTaskProperty(formProperty);
  const name = getName(formProperty, index);
  const message = getQuestionMessage(task, taskProperty, formProperty.message, taskInfo, name);
  const type = getType(formProperty.type);
  const defaultValue = getDefault(formProperty.value, taskProperty, task);

  const question: TaskQuestion = {
    name: name,
    type: type,
    default: defaultValue,
    message: message,
  };

  const guiOptions: GuiOptions = {};

  if (has(formProperty, "isValid") && isFunction(formProperty.isValid)) {
    question.validate = async function (value: any): Promise<string | boolean> {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- existance is verified above
      const result = await formProperty.isValid!(value);
      return result !== "" ? result : true;
    };
  }

  if (has(formProperty, "hint")) {
    guiOptions.hint = formProperty.hint;
  }

  if (formProperty.readonly) {
    guiOptions.type = "label";
    question.default = `<p class='readonly-label'>${question.default}</p>`;
  }

  // mutate the question attributes according to specific types of properties
  handleFileBrowser(formProperty.type, question, guiOptions);
  handleFolderBrowser(formProperty.type, question, guiOptions);
  handleCheckbox(formProperty, question);
  handleCombobox(formProperty, question);
  handleConfirm(formProperty, question);
  handleTable(formProperty, question);

  handleMandatoryField(formProperty, guiOptions, question);

  const keys = Object.keys(guiOptions);
  if (keys.length > 0) {
    question.guiOptions = guiOptions;
  }
  return question;
}

function handleMandatoryField(formProperty: FormProperty, guiOptions: GuiOptions, question: TaskQuestion): void {
  if (!formProperty.optional && !formProperty.readonly) {
    guiOptions.mandatory = true;
    if (question.type === "combobox" || question.type === "input" || question.type === "editor") {
      question.validate = combineValidationFunctions(isValueProvided, question.validate);
    }
  }
}

async function isValueProvided(value: string): Promise<string | boolean> {
  return value === "" ? messages.MANDATORY_FIELD() : true;
}

function handleCheckbox(formProperty: FormProperty, question: TaskQuestion): void {
  if (formProperty.type === "checkbox") {
    question.choices = formProperty.list;
    question.type = formProperty.type;
  }
}

function handleConfirm(formProperty: FormProperty, question: TaskQuestion): void {
  if (formProperty.type === "confirm") {
    question.type = formProperty.type;
  }
}

function handleCombobox(formProperty: FormProperty, question: TaskQuestion): void {
  if (formProperty.type === "combobox") {
    question.choices = formProperty.list;
    question.type = "list";
  }
}

function handleTable(formProperty: FormProperty, question: TaskQuestion): void {
  if (formProperty.type === "table") {
    question.choices = map(formProperty.list, (_) => {
      return { key: _, name: _, value: _ };
    });
    question.type = "expand";
  }
}

function getTaskProperty(formProperty: FormProperty): string | undefined {
  let taskProperty = formProperty.taskProperty;
  if (taskProperty === undefined && formProperty.type === "label") {
    taskProperty = "label";
  }
  return taskProperty;
}

function getName(formProperty: FormProperty, index: number): string {
  const name = formProperty.name ?? formProperty.taskProperty;
  if (name === undefined) {
    return formProperty.type === "label" ? "label" : `prop${index}`;
  }
  return name;
}

function getType(formPropertyType: string): string {
  if (formPropertyType === "label" || formPropertyType === "file" || formPropertyType === "folder") {
    return "input";
  }
  return formPropertyType;
}

type valueType = string | boolean | undefined | string[];

function getDefault(
  value: valueType,
  taskProperty: string | undefined,
  task: ConfiguredTask,
): string | boolean | string[] {
  if (value === undefined) {
    return taskProperty !== undefined ? task[taskProperty] : "";
  } else {
    return value;
  }
}

function getQuestionMessage(
  task: ConfiguredTask,
  taskProperty: string | undefined,
  message: string | undefined,
  taskInfo: Pick<AppEvents, "getTaskPropertyDescription">,
  questionName: string,
): string {
  if (!taskProperty || message) {
    return message ?? questionName;
  }
  return taskInfo.getTaskPropertyDescription(task.type, taskProperty);
}

function handleFileBrowser(originalType: string, question: TaskQuestion, guiOptions: GuiOptions): void {
  if (originalType === "file" && guiOptions.type !== "label") {
    guiOptions.type = "file-browser";
    question.getFilePath = "__Function";
  }
}

function handleFolderBrowser(originalType: string, question: TaskQuestion, guiOptions: GuiOptions): void {
  if (originalType === "folder" && guiOptions.type !== "label") {
    guiOptions.type = "folder-browser";
    question.getPath = "__Function";
  }
}

export function combineValidationFunctions(
  first: validationFunction | undefined,
  second: validationFunction | undefined,
): validationFunction {
  return async function (value: string): Promise<boolean | string> {
    const firstResult = await callValidationFunction(first, value);
    if (firstResult !== true) {
      return firstResult;
    }
    return callValidationFunction(second, value);
  };
}

async function callValidationFunction(func: validationFunction | undefined, value: string): Promise<string | boolean> {
  return func !== undefined ? func(value) : true;
}
