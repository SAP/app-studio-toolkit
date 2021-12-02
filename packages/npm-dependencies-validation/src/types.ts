import { OutputChannel } from "vscode";

export type NpmLsResult = {
  name?: string;
  version?: string;
  problems: string[];
};

export type DependenciesPropertyName = "dependencies" | "devDependencies";

export type PackageJson = {
  name: string;
  version: string;
} & DependenciesProperties;

export type DependenciesProperties = {
  [key in DependenciesPropertyName]?: {
    [key: string]: string;
  };
};

export type VscodeOutputChannel = Pick<OutputChannel, "append">;

export type NpmCommandConfig = {
  cwd: string;
  commandArgs: string[];
};
