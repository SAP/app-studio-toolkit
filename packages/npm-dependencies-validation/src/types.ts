import { PackageJson } from "type-fest";

export interface OutputChannel {
  appendLine: (message: string) => void;
  show(preserveFocus?: boolean): void;
}

export type NpmCommandConfig = {
  cwd: string;
  commandArgs: string[];
};

// TODO: evaluate if this is still used?
export type FilePaths = {
  filePath: string;
  dirPath: string;
};

export type PackageJsonVersion = string;
export type SemVerRange = string;
export type DepsProp = "dependencies" | "devDependencies";
export type PackageJsonDeps = Pick<PackageJson, DepsProp>;

export type DepIssue = MismatchDepIssue | MissingDepIssue;

export interface MismatchDepIssue {
  type: "mismatch";
  name: string;
  isDev: boolean;
  expected: SemVerRange;
  actual: PackageJsonVersion;
}

export interface MissingDepIssue {
  type: "missing";
  name: string;
  isDev: boolean;
}
