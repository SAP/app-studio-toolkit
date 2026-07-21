import * as path from "path";
import { existsSync, mkdirSync } from "fs";
import { homedir } from "os";
import lodash from "lodash";
import { vscode } from "./vscodeProxy.js";

const { isEmpty, trim } = lodash;

export const GLOBAL_CONFIG_KEY = "ApplicationWizard.installationLocation";

// Matches leading home-dir tokens: ~, $HOME, %USERPROFILE% (case-insensitive).
// The token must be followed by / \ or end-of-string — not a longer word.
const HOME_TOKEN_RE = /^(~|\$HOME|%USERPROFILE%)(\/|\\|$)/i;

// Expand leading ~ and common home-dir env vars to their absolute paths.
// Handles ~ / ~/path / ~\path, $HOME/path, %USERPROFILE%/path (case-insensitive).
// This keeps backward compatibility with configs that used shell-expanded values.
const normaliseToAbsolute = (filePath: string): string => {
  const home = homedir();
  const match = HOME_TOKEN_RE.exec(filePath);
  if (match) {
    filePath = home + filePath.slice(match[1].length);
  }
  if (!path.isAbsolute(filePath)) {
    filePath = path.resolve(home, filePath);
  }
  return filePath;
};

const getAbsoluteCustomPath = (): string | undefined => {
  const customPath = trim(
    vscode.workspace.getConfiguration().get(GLOBAL_CONFIG_KEY)
  );
  if (isEmpty(customPath)) {
    return;
  }

  return normaliseToAbsolute(customPath);
};

const isCustomPathExist = (customPath: string) => {
  const exists = existsSync(customPath);
  return exists;
};

export const getPath = (): string => {
  const customPath = getAbsoluteCustomPath();
  if (!customPath) {
    return undefined;
  }
  return isCustomPathExist(customPath) ? trim(customPath) : undefined;
};

export const DEFAULT_LOCATION = path.join(
  homedir(),
  ".application_wizard",
  "generators"
);

export const getNodeModulesPath = (): string => {
  const customPath: string = getPath();
  if (!isEmpty(customPath)) {
    const customNodeModulesPath = path.join(customPath, "node_modules");
    return customNodeModulesPath;
  }
};

export const setDefaultPath = (): Thenable<void> => {
  mkdirSync(DEFAULT_LOCATION, { recursive: true });
  return vscode.workspace
    .getConfiguration()
    .update(
      GLOBAL_CONFIG_KEY,
      DEFAULT_LOCATION,
      vscode.ConfigurationTarget.Global
    );
};
