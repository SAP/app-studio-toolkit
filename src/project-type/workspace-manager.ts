import { resolve } from "path";
import { workspace } from "vscode";
import { forEach } from "lodash";
import { insertToProjectTypeMaps } from "./contexts";
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-var-requires

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-var-requires
const WorkspaceProjectImpl = require("@ext-lcapvsc-npm-dev/lcap-project-api/dist/src/project-api/WorkspaceImpl")
  .default;

// TODO: use proper types from project library (once properly exported)
type ProjectAPI = any;
type WorkspaceAPI = any;
let workspaceAPI: WorkspaceAPI;

export function initWorkspaceAPI() {
  workspaceAPI = new WorkspaceProjectImpl();
}

export function getWorkspaceAPI():WorkspaceAPI {
  return workspaceAPI;
}

export async function initWorkspaceProjectTypeContexts(
  workspaceAPI: WorkspaceAPI
): Promise<void> {
  let allProjectsAPI: ProjectAPI[] = [];
  try {
    allProjectsAPI = await workspaceAPI.getProjects();
  } catch (e) {
    console.error(e);
  }

  forEach(allProjectsAPI, async (currProjectAPI) => {
    const projectAbsRoot = currProjectAPI.path;
    try {
      const currProjectDS = await currProjectAPI.read();
      insertToProjectTypeMaps(projectAbsRoot, currProjectDS.tags);
      forEach(currProjectDS.modules, (currModule) => {
        // `Module["path"]` is relative to the project's root
        const moduleAbsPath = resolve(projectAbsRoot, currModule.path);
        insertToProjectTypeMaps(moduleAbsPath, currModule.tags);
        forEach(currModule.items, (currItem) => {
          // `Item["path"]` is also relative to the project's root
          const itemAbsPath = resolve(projectAbsRoot, currItem.path);
          insertToProjectTypeMaps(itemAbsPath, currItem.tags);
        });
      });
    } catch (e) {
      console.error(e);
    }
  });
}

// const ProjectImpl = require("@ext-lcapvsc-npm-dev/lcap-project-api/dist/src/project-api/ProjectImpl");

// async function readWorkspaceProjectDS(
//   wsRoot: string
// ): Promise<ProjectAPI | undefined> {
//   // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
//   const projectApi = new ProjectImpl.default(wsRoot, true);
//   try {
//     const projectDS = await projectApi.read(undefined);
//     return projectDS;
//   } catch (e) {
//     // TODO: proper logging
//     console.error(e);
//   }
//   // oops
//   return undefined;
// }
