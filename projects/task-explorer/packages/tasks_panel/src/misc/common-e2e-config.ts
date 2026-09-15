import { TaskDefinition, Uri, workspace } from "vscode";
import {
  CAP_DEPLOYMENT_CONFIG,
  FIORI_DEPLOYMENT_CONFIG,
  HANA_DEPLOYMENT_CONFIG,
  ProjectInfo,
  ProjTypes,
  collectProjects,
} from "./e2e-config";
import { FioriProjectConfigInfo, fioriE2eConfig, getFioriE2ePickItems } from "./fiori-e2e-config";
import { CapProjectConfigInfo, capE2eConfig, getCapE2ePickItems } from "./cap-e2e-config";
import { HanaProjectConfigInfo, getHanaE2ePickItems, hanaE2eConfig } from "./hana-e2e-config";
import { getLogger } from "../../src/logger/logger-wrapper";
import { compact, filter, reduce } from "lodash";
import { join } from "path";
import { isPathRelatedToFolder } from "../utils/ws-folder";

export type ProjectConfigInfo = FioriProjectConfigInfo | CapProjectConfigInfo | HanaProjectConfigInfo;

export function isDeploymentConfigTask(task: TaskDefinition): boolean {
  return [FIORI_DEPLOYMENT_CONFIG, HANA_DEPLOYMENT_CONFIG, CAP_DEPLOYMENT_CONFIG].includes(task.type);
}
export async function completeDeployConfig(task: any): Promise<void> {
  if (task.type === FIORI_DEPLOYMENT_CONFIG) {
    return fioriE2eConfig({ wsFolder: task.wsFolder, project: task.project });
  } else if (task.type === CAP_DEPLOYMENT_CONFIG) {
    return capE2eConfig({ wsFolder: task.wsFolder, project: task.project });
  } else if (task.type === HANA_DEPLOYMENT_CONFIG) {
    return hanaE2eConfig({ wsFolder: task.wsFolder, project: task.project });
  }

  getLogger().debug("completeDeployConfig:: unsupported configuration task type", { type: task.type });
}

export async function getConfigDeployPickItems(project: string): Promise<ProjectConfigInfo[]> {
  let items = [] as Promise<ProjectConfigInfo | undefined>[];
  const requestedFolder = workspace.getWorkspaceFolder(Uri.file(project));
  if (requestedFolder) {
    const projects = filter(await collectProjects(requestedFolder.uri.path), (_) =>
      isPathRelatedToFolder(join(_.wsFolder, _.project), project),
    );
    items = reduce(
      projects,
      (acc, info: ProjectInfo) => {
        if (info.style === ProjTypes.FIORI_FE) {
          acc.push(getFioriE2ePickItems(info));
        } else if (info.style === ProjTypes.CAP) {
          acc.push(getCapE2ePickItems(info));
        } else if (info.style === ProjTypes.HANA) {
          acc.push(getHanaE2ePickItems(info));
        }
        return acc;
      },
      items,
    );
  }
  return Promise.all(items).then((items) => compact(items));
}

export function composeDeploymentConfigLabel(type: string): string {
  let project = "Unknown";
  if (type === FIORI_DEPLOYMENT_CONFIG) {
    project = "Fiori";
  } else if (type === CAP_DEPLOYMENT_CONFIG) {
    project = "Full Stack";
  } else if (type === HANA_DEPLOYMENT_CONFIG) {
    project = "Hana";
  }
  return `${project} Configuration`;
}
