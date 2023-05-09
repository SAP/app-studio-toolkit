import { workspace, WorkspaceConfiguration } from "vscode";
import { uniqWith, isEqual, size } from "lodash";

const key = "actions";

const addActions = (actions: any[], config: WorkspaceConfiguration): void => {
  const configActions = config.get<any[]>(key, []);
  actions.splice(actions.length, 0, ...configActions);
};

export const get = (): any[] => {
  const actions: any[] = [];

  workspace.workspaceFolders?.forEach((wsFolder) => {
    addActions(actions, workspace.getConfiguration(undefined, wsFolder.uri));
  });

  addActions(actions, workspace.getConfiguration());

  return uniqWith(actions, isEqual);
};

export const clear = (): void => {
  workspace.workspaceFolders?.forEach((wsFolder) => {
    const configurations = workspace.getConfiguration(undefined, wsFolder.uri);
    if (size(configurations["actions"]) > 0) {
      void configurations.update(key, undefined); // removes actions key if they exist
    }
  });

  const configurations = workspace.getConfiguration();
  if (size(configurations["actions"]) > 0) {
    void configurations.update(key, undefined);
  }
};
