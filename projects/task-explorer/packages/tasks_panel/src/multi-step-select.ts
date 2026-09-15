import { ConfiguredTask } from "@sap_oss/task_contrib_types";
import { compact, each, extend, filter, find, groupBy, isEmpty, isEqual, keys, map, size, sortBy, uniq } from "lodash";
import {
  QuickPickItem,
  window,
  Disposable,
  QuickInputButton,
  QuickInput,
  QuickInputButtons,
  QuickPickItemKind,
  QuickPick,
} from "vscode";
import { MISC, isMatchBuild, isMatchDeploy, isPathRelatedToFolder } from "./utils/ws-folder";
import { messages } from "./i18n/messages";
import { ElementTreeItem, IntentTreeItem, ProjectTreeItem, RootTreeItem } from "./view/task-tree-item";
import { ProjectConfigInfo, composeDeploymentConfigLabel, getConfigDeployPickItems } from "./misc/common-e2e-config";
import { collectProjects, calculateTaskWsFolder } from "./misc/e2e-config";
import { join } from "path";

const miscItem = { label: "$(list-unordered)", description: MISC, type: "intent" };

function isMatchBuildOrDeploy(intent: string): boolean {
  return isMatchBuild(intent) || isMatchDeploy(intent);
}

function filterTasksByFolder(tasks: ConfiguredTask[], parent: string): ConfiguredTask[] {
  return filter(tasks, (task) => {
    return isPathRelatedToFolder(calculateTaskWsFolder(task), parent);
  });
}

async function grabProjectItems(tasks: ConfiguredTask[], project?: string): Promise<QuickPickItem[]> {
  const folders: string[] = keys(groupBy(tasks, "__wsFolder"));
  let projects = [...folders];
  for (const folder of folders) {
    const projs = map(await collectProjects(folder), (_) => join(_.wsFolder, _.project));
    projects.push(...projs);
  }
  projects = uniq(projects);
  const items = project && projects.includes(project) ? [project] : projects;
  return map(items, (_) => {
    return { label: "$(folder)", description: _ };
  });
}

async function grabTasksByGroup(
  tasks: ConfiguredTask[],
  project: string,
  group?: string | undefined,
): Promise<QuickPickItem[]> {
  function toConfigDeployE2ePickItems(items: ProjectConfigInfo[]): QuickPickItem[] {
    return map(items, (item) => {
      return {
        label: "Define Deployment parameters",
        detail: `${item.project || item.wsFolder}`,
        ...item,
      };
    });
  }

  const pickItems: any[] = [];
  const deploymentParamItems =
    !group || isMatchBuildOrDeploy(group) ? toConfigDeployE2ePickItems(await getConfigDeployPickItems(project)) : [];
  if (!isEmpty(deploymentParamItems)) {
    const groupByType = groupBy(deploymentParamItems, "type");
    each(keys(groupByType), (key) => {
      pickItems.push({ label: composeDeploymentConfigLabel(key), kind: QuickPickItemKind.Separator });
      pickItems.push(...groupByType[key]);
    });
  }

  const tasksByProject = filterTasksByFolder(tasks, project);
  each(sortBy(uniq(map(tasksByProject, "__intent"))), (intent: string) => {
    // add a group separator
    if (isMatchBuildOrDeploy(intent)) {
      if (isEmpty(deploymentParamItems)) {
        if (!group || group.toLowerCase() === intent.toLowerCase()) {
          // fiori projects workaround: hide `Build`/`Deploy` npm tasks if fiori e2e deployment configuration needed
          pickItems.push({ label: intent, kind: QuickPickItemKind.Separator });
          pickItems.push(
            ...compact(
              map(tasksByProject, (_) => {
                if (_.__intent === intent) {
                  return { ..._, ...{ description: _.type }, ...(_.description ? { detail: _.description } : {}) };
                }
              }),
            ),
          );
        }
      }
    } else {
      if (!group && !find(pickItems, miscItem)) {
        // add a special item (once) --> 'Miscellaneous' group
        pickItems.push({ label: MISC, kind: QuickPickItemKind.Separator });
        pickItems.push(miscItem);
      }
    }
  });
  return compact(pickItems);
}

function grabMiscTasksByProject(tasks: ConfiguredTask[], project: string): QuickPickItem[] {
  const tasksByProject = filterTasksByFolder(tasks, project);
  return compact(
    map(tasksByProject, (_) => {
      if (!isMatchDeploy(_.__intent) && !isMatchBuild(_.__intent)) {
        return { ..._, description: _.type };
      }
    }),
  );
}

/* istanbul ignore next */
export async function multiStepTaskSelect(tasks: ConfiguredTask[], treeItem?: ElementTreeItem): Promise<any> {
  interface State {
    title: string;
    step: number;
    totalSteps: number;
    project: QuickPickItem;
    taskByGroup: QuickPickItem;
    task: QuickPickItem;
  }

  function getContextProject(): string | undefined {
    let project;
    if (treeItem instanceof ProjectTreeItem || treeItem instanceof RootTreeItem) {
      project = treeItem.fqn;
    } else if (treeItem instanceof IntentTreeItem) {
      project = (treeItem.parent as ProjectTreeItem)?.fqn;
    }
    return project;
  }

  function getContextIntent(): string | undefined {
    if (treeItem instanceof IntentTreeItem) {
      return treeItem.label?.toString();
    }
  }

  async function collectInputs(): Promise<State> {
    const state = {} as Partial<State>;
    const projects = await grabProjectItems(tasks, getContextProject());
    let step: InputStep;

    if (getContextIntent() === MISC) {
      state.project = find(projects, ["description", getContextProject()]) || projects[0];
      state.taskByGroup = miscItem;
      step = (input) => pickMiscTask(input, state);
    } else if (size(projects) > 1) {
      step = (input) => pickProjects(input, state);
    } else {
      state.project = projects[0];
      step = (input) => pickTaskByGroup(input, state);
    }
    await MultiStepSelection.run(step);
    return state as State;
  }

  async function pickProjects(input: MultiStepSelection, state: Partial<State>) {
    const pickItems = await grabProjectItems(tasks, getContextProject());
    state.project = await input.showQuickPick({
      placeholder: messages.create_task_pick_project_placeholder,
      items: pickItems,
      activeItem: find(pickItems, state.project),
      shouldResume: shouldResume,
    });
    return (input: MultiStepSelection) => pickTaskByGroup(input, state);
  }

  async function pickTaskByGroup(input: MultiStepSelection, state: Partial<State>) {
    const pickItems = await grabTasksByGroup(tasks, state.project?.description ?? "", getContextIntent());
    state.taskByGroup = await input.showQuickPick({
      placeholder: messages.create_task_pick_task_placeholder,
      items: pickItems,
      activeItem: find(pickItems, state.taskByGroup),
      shouldResume: shouldResume,
    });
    if (isEqual(state.taskByGroup, miscItem)) {
      return (input: MultiStepSelection) => pickMiscTask(input, state);
    } else {
      state.task = state.taskByGroup;
    }
  }

  async function pickMiscTask(input: MultiStepSelection, state: Partial<State>) {
    const pickItems = grabMiscTasksByProject(tasks, state.project?.description ?? "");
    state.task = await input.showQuickPick({
      placeholder: messages.create_task_pick_task_placeholder,
      items: pickItems,
      activeItem: find(pickItems, state.task) as QuickPickItem | undefined,
      shouldResume: shouldResume,
    });
  }

  function shouldResume() {
    // Could show a notification with the option to resume.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- for future use
    return new Promise<boolean>((resolve, reject) => {
      // noop
    });
  }

  const state = await collectInputs();
  delete state.task?.description; // supposed added for a QuickPick purpose
  return state;
}

class InputFlowAction {
  static back = new InputFlowAction();
  static cancel = new InputFlowAction();
  static resume = new InputFlowAction();
}

type InputStep = (input: MultiStepSelection) => Thenable<InputStep | void>;

interface QuickPickParameters<T extends QuickPickItem> {
  title?: string;
  step?: number;
  totalSteps?: number;
  items: T[];
  activeItem?: T;
  ignoreFocusOut?: boolean;
  placeholder: string;
  buttons?: QuickInputButton[];
  shouldResume: () => Thenable<boolean>;
}

/* istanbul ignore next */
class MultiStepSelection {
  static async run(start: InputStep) {
    const input = new MultiStepSelection();
    return input.stepThrough(start);
  }

  private current?: QuickInput;
  private steps: InputStep[] = [];

  private async stepThrough(start: InputStep) {
    let step: InputStep | void = start;
    while (step) {
      this.steps.push(step);
      try {
        step = await step(this);
      } catch (err) {
        if (err === InputFlowAction.back) {
          this.steps.pop();
          step = this.steps.pop();
        } else if (err === InputFlowAction.resume) {
          step = this.steps.pop();
        } else if (err === InputFlowAction.cancel) {
          step = undefined;
        } else {
          throw err;
        }
      }
    }
    if (this.current) {
      this.current.dispose();
    }
  }

  async showQuickPick<T extends QuickPickItem, P extends QuickPickParameters<T>>({
    title,
    step,
    totalSteps,
    items,
    activeItem,
    ignoreFocusOut,
    placeholder,
    buttons,
    shouldResume,
  }: P) {
    const disposables: Disposable[] = [];
    try {
      return await new Promise<T | (P extends { buttons: (infer I)[] } ? I : never)>((resolve, reject) => {
        const input: QuickPick<T> = extend(
          window.createQuickPick<T>(),
          title ? { title } : {},
          step ? { step } : {},
          totalSteps ? { totalSteps } : {},
          ignoreFocusOut ? { ignoreFocusOut } : { ignoreFocusOut: true },
          { matchOnDescription: true },
          { placeholder, items },
          activeItem ? { activeItems: [activeItem] } : {},
        );
        input.buttons = [...(this.steps.length > 1 ? [QuickInputButtons.Back] : []), ...(buttons || [])];
        disposables.push(
          input.onDidTriggerButton((item) => {
            if (item === QuickInputButtons.Back) {
              reject(InputFlowAction.back);
            } else {
              resolve(<any>item);
            }
          }),
          input.onDidChangeSelection((items) => resolve(items[0])),
          input.onDidHide(() => {
            (async () => {
              reject(shouldResume && (await shouldResume()) ? InputFlowAction.resume : InputFlowAction.cancel);
            })().catch(reject);
          }),
        );
        if (this.current) {
          this.current.dispose();
        }
        this.current = input;
        this.current.show();
      });
    } finally {
      disposables.forEach((d) => d.dispose());
    }
  }
}

// for unit testing purpose only
export const __internal = {
  grabMiscTasksByProject,
  grabProjectItems,
  grabTasksByGroup,
  miscItem,
};
