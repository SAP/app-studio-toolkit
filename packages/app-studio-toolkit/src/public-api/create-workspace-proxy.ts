import { WorkspaceApi } from "@sap/artifact-management";
import { BasWorkspaceApi } from "@sap-devx/app-studio-toolkit-types";

export function createWorkspaceProxy(
  workspaceImpl: WorkspaceApi
): BasWorkspaceApi {
  const basWsAPI = {
    getProjects: (...args: Parameters<WorkspaceApi["getProjects"]>) =>
      workspaceImpl.getProjects(...args),
    getProjectUris: (...args: Parameters<WorkspaceApi["getProjectUris"]>) =>
      workspaceImpl.getProjectUris(...args),
    onWorkspaceChanged: (
      ...args: Parameters<WorkspaceApi["onWorkspaceChanged"]>
    ) => workspaceImpl.onWorkspaceChanged(...args),
  };

  Object.freeze(basWsAPI);
  // TODO: discuss this with the @sap/artifact-management owners.
  //       could it be caused by our patches (with npm-patch-package)?
  // @ts-expect-error -- https://github.com/microsoft/TypeScript/issues/26559
  return basWsAPI;
}
