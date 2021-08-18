import { workspace } from "vscode";

const key = "actions";

export const get = (): string[] => {
  return workspace.getConfiguration().get(key, []);
};

export const clear = (): Thenable<void> => {
  return workspace.getConfiguration().update(key, []);
};
