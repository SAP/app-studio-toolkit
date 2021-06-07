import { resolve } from "path";
import { workspace } from "vscode";
import { forEach } from "lodash";
import { insertToProjectTypeMaps } from "./contexts";
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-var-requires
const ProjectImpl = require("@ext-lcapvsc-npm-dev/lcap-project-api/dist/src/project-api/ProjectImpl");

export async function initWorkspaceProjectTypeContexts(): Promise<void> {
  const wsRoot = workspace.rootPath as string;
  // TODO: we need an API that would support multiple projects directly nested under the WS root.
  //      - See: https://github.tools.sap/LCAP/project/issues/81
  const projectDS = await readWorkspaceProjectDS(wsRoot);

  if (projectDS !== undefined) {
    const projectAbsRoot = projectDS.path;
    insertToProjectTypeMaps(projectAbsRoot, projectDS.tags);
    forEach(projectDS.modules, (currModule) => {
      // `Module["path"]` is relative to the project's root
      const moduleAbsPath = resolve(projectAbsRoot, currModule.path);
      insertToProjectTypeMaps(moduleAbsPath, currModule.tags);
      forEach(currModule.items, (currItem) => {
        // `Item["path"]` is also relative to the project's root
        const itemAbsPath = resolve(projectAbsRoot, currItem.path);
        insertToProjectTypeMaps(itemAbsPath, currItem.tags);
      });
    });
  }
}

// TODO: use proper types from project library (once properly exported)
type WorkspaceProjectType = any;

async function readWorkspaceProjectDS(
  wsRoot: string
): Promise<WorkspaceProjectType | undefined> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
  const projectApi = new ProjectImpl.default(wsRoot, true);
  try {
    const projectDS = await projectApi.read(undefined);
    return projectDS;
  } catch (e) {
    // TODO: proper logging
    console.error(e);
  }
  // oops
  return undefined;
}
