import { WorkspaceAPI } from "./types";
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-var-requires

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-var-requires
const WorkspaceProjectImpl = require("@ext-lcapvsc-npm-dev/lcap-project-api/dist/src/project-api/WorkspaceImpl")
  .default;

let workspaceAPI: WorkspaceAPI;

export function initWorkspaceAPI() {
  workspaceAPI = new WorkspaceProjectImpl();
}

export function getWorkspaceAPI(): WorkspaceAPI {
  return workspaceAPI;
}
