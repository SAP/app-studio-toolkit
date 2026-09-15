import { GlobPattern, TaskDefinition, Uri, extensions, workspace } from "vscode";
import { BasToolkit } from "@sap-devx/app-studio-toolkit-types";
import {
  Dictionary,
  compact,
  concat,
  extend,
  find,
  includes,
  isEmpty,
  isMatch,
  last,
  reduce,
  size,
  split,
} from "lodash";
import { exceptionToString, getUniqueTaskLabel, updateTasksConfiguration } from "../../src/utils/task-serializer";
import { DEFAULT_TARGET, cfGetConfigFileField, cfGetTargets } from "@sap/cf-tools";
import { getLogger } from "../../src/logger/logger-wrapper";
import { sep, join, relative } from "path";
import { ConfiguredTask } from "@sap_oss/task_contrib_types";
import { isPathRelatedToFolder } from "../utils/ws-folder";

export const ProjTypes = {
  FIORI_FE: "fiori_fe",
  CAP: "cap",
  LCAP: "lcap",
  HANA: "hana",
} as const;

// Convert object key in a type
export type ProjectTypes = (typeof ProjTypes)[keyof typeof ProjTypes];

type CfDetails = {
  cfTarget: string;
  cfEndpoint: string;
  cfOrg: string;
  cfSpace: string;
};

export const FIORI_DEPLOYMENT_CONFIG = "fioriDeploymentConfig";
export const CAP_DEPLOYMENT_CONFIG = "capDeploymentConfig";
export const HANA_DEPLOYMENT_CONFIG = "hanaDeploymentConfig";

export interface ProjectInfo {
  wsFolder: string;
  project: string;
  style: ProjectTypes;
}

export async function waitForFileResource(
  pattern: GlobPattern,
  ignoreCreateEvents?: boolean,
  ignoreChangeEvents?: boolean,
  ignoreDeleteEvents?: boolean,
): Promise<boolean> {
  return new Promise((resolve) => {
    const fileWatcher = workspace.createFileSystemWatcher(
      pattern,
      ignoreCreateEvents,
      ignoreChangeEvents,
      ignoreDeleteEvents,
    );
    function endWatch() {
      fileWatcher.dispose();
      resolve(true);
    }
    fileWatcher.onDidChange(() => endWatch());
    fileWatcher.onDidCreate(() => endWatch());
    fileWatcher.onDidDelete(() => endWatch());
  });
}

export async function areResourcesReady(promises: Promise<boolean>[], timeout = 5): Promise<boolean> {
  return Promise.race([
    Promise.all(promises),
    new Promise((resolve) => setTimeout(() => resolve(false), timeout * 1000)),
  ]).then((status) => {
    if (typeof status === "boolean") {
      // timeout occurred
      return status; // false
    } else {
      // [statuses]
      return !includes(status as Dictionary<boolean>, false);
    }
  });
}

type ProjectInfoCache = {
  projects: ProjectInfo[];
  timestamp: number;
};

const _projectsInfoCache: Map<string, ProjectInfoCache> = new Map<string, ProjectInfoCache>();
function getProjectsInfoFromCache(wsFolder: string): ProjectInfo[] | undefined {
  const cached = _projectsInfoCache.get(wsFolder);
  // internal usage cache of 5 seconds
  if (cached && Date.now() - cached.timestamp < 5000) {
    return cached.projects;
  }
}

function setProjectsInfoToCache(wsFolder: string, projects: ProjectInfo[]): void {
  _projectsInfoCache.set(wsFolder, { projects, timestamp: Date.now() });
}

export async function collectProjects(wsFolder: string, disableCache = false): Promise<ProjectInfo[]> {
  // discovering projects in a workspace is a costly operation, so we cache the result for 5 seconds (assuming projects
  // don't change during this time) useful in cases where this method is called multiple times on the same flow
  const cached = getProjectsInfoFromCache(wsFolder);
  if (!disableCache && cached) {
    return cached;
  }
  function asWsRelativePath(absPath: string): string {
    const project = workspace.asRelativePath(absPath, false);
    return project === absPath ? "" /*single root*/ : project;
  }
  const items: Promise<ProjectInfo | undefined>[] = [];
  const requestedFolder = Uri.file(wsFolder);
  const btaExtension: any = extensions.getExtension("SAPOSS.app-studio-toolkit");
  const basToolkitAPI: BasToolkit = btaExtension?.exports;
  const workspaceAPI = basToolkitAPI?.workspaceAPI ?? { getProjects: () => Promise.resolve([]) };

  for (const project of await workspaceAPI.getProjects()) {
    items.push(
      project.getProjectInfo().then((info) => {
        if (info) {
          const workspaceFolder = workspace.getWorkspaceFolder(Uri.file(info.path));
          if (isPathRelatedToFolder(workspaceFolder?.uri.path ?? "", requestedFolder.path)) {
            let style: ProjectTypes | undefined;
            if (info.type === "com.sap.fe") {
              style = ProjTypes.FIORI_FE;
            } else if (/^com\.sap\.cap(\.java)?$/.test(info.type)) {
              style = ProjTypes.CAP;
            } else if (info.type === "com.sap.hana") {
              style = ProjTypes.HANA;
            }
            if (style !== undefined) {
              return {
                wsFolder,
                project: asWsRelativePath(info.path),
                style,
              };
            }
          }
        }
      }),
    );
  }
  const projects = compact(await Promise.all(items));
  setProjectsInfoToCache(wsFolder, projects);
  return projects;
}

export async function addTaskDefinition(wsFolder: string, tasks: TaskDefinition[]): Promise<any> {
  return updateTasksConfiguration(
    wsFolder,
    concat(workspace.getConfiguration("tasks", Uri.file(wsFolder))?.get("tasks") ?? [], tasks),
  );
}

export async function doesFileExist(uri: Uri): Promise<boolean> {
  try {
    return !!(await workspace.fs.stat(uri));
  } catch (e) {
    return false;
  }
}

export type LabelType = "uniq" | "sequence";

export async function generateMtaDeployTasks(
  wsFolder: string,
  project: string,
  labelType: LabelType = "uniq",
): Promise<TaskDefinition[]> {
  async function populateCfDetails(): Promise<CfDetails> {
    try {
      const targets = await cfGetTargets();
      if (isEmpty(targets) || (size(targets) === 1 && targets[0].label === DEFAULT_TARGET)) {
        throw new Error("No CF targets found");
      }
      const targetName = find(targets, "isCurrent")?.label;
      if (!targetName) {
        throw new Error("No CF current target defined");
      }
      return {
        cfTarget: targetName,
        cfEndpoint: (await cfGetConfigFileField("Target", targetName)) ?? "",
        cfOrg: (await cfGetConfigFileField("OrganizationFields", targetName))?.Name ?? "",
        cfSpace: (await cfGetConfigFileField("SpaceFields", targetName))?.Name ?? "",
      };
    } catch (e: any) {
      getLogger().debug(`Can not populate cf target details`, { reason: exceptionToString(e) });
      return { cfTarget: "", cfEndpoint: "", cfOrg: "", cfSpace: "" };
    }
  }
  const projectUri = Uri.joinPath(Uri.file(wsFolder), project);
  const buildTaskLabel = `Build ${project}`;
  const taskBuild = {
    type: "build.mta",
    label: labelType === "uniq" ? getUniqueTaskLabel(buildTaskLabel) : buildTaskLabel,
    taskType: "Build",
    projectPath: `${projectUri.fsPath}`,
    extensions: [],
  };
  const deployTaskLabel = `Deploy to Cloud Foundry ${project}`;
  const taskDeploy = extend(
    {
      type: "deploy.mta.cf",
      label: labelType === "uniq" ? getUniqueTaskLabel(deployTaskLabel) : deployTaskLabel,
      taskType: "Deploy",
      mtarPath: join(projectUri.fsPath, "mta_archives", `${project || last(compact(split(wsFolder, sep)))}_0.0.1.mtar`),
      extensions: [],
      dependsOn: [`${taskBuild.label}`],
    },
    await populateCfDetails(),
  );

  return [taskBuild, taskDeploy];
}

export function isTasksSettled(wsFolder: string, targetTasks: TaskDefinition[]): boolean {
  const tasks: TaskDefinition[] = workspace.getConfiguration("tasks", Uri.file(wsFolder)).get("tasks") ?? [];
  return reduce(
    targetTasks,
    (acc, task) => {
      acc &&= !!find(tasks, (_) => {
        return isMatch(_, task);
      });
      return acc;
    },
    true,
  );
}

export function calculateTaskWsFolder(task: ConfiguredTask): string {
  let key = "";
  // internal euristic to recognize the task relation to the workspace folder
  if (task.type === "npm") {
    if (task.path) {
      key = "path";
    } else if (task.options?.cwd) {
      key = "options.cwd";
    }
  } else if (/(.*\.mta(\.cf$)?)|(^deploy$)/.test(task.type)) {
    if (task.projectPath) {
      key = "projectPath";
    } else if (task.mtarPath) {
      key = "mtarPath";
    }
  } else if (task.type === "npm-script") {
    if (task.packageJSONPath) {
      key = "packageJSONPath";
    }
  }
  // get the task nested property value
  let projectPath: any = key.split(".").reduce((object, property) => object[property], task) ?? "";
  // if the path includes the workspace folder, use the relative path
  // example:  task { type: "npm", path: "/home/user/ws1/project1" } and wsFolder: /home/user/ws1
  // expected projectFolder result: "project1"
  if (isPathRelatedToFolder(projectPath, task.__wsFolder)) {
    projectPath = relative(task.__wsFolder, projectPath);
  }

  return join(task["__wsFolder"], projectPath);
}
