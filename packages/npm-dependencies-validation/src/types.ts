import { OutputChannel } from "vscode";

export type NPMDependencyIssue = {
  name: string;
  version: string;
  type: NpmLsIssueType;
  devDependency: boolean;
  message: string;
};

export type NpmLsResult = {
  name: string;
  version: string;
  dependencies: NpmLsDependencies;
};

export type NpmLsDependencies =
  | NpmLsDependenciesWithoutIssues
  | NpmLsDependenciesWithIssues;

export type NpmLsDependenciesWithoutIssues = {
  [key: string]: NpmLsDependencyWithoutIssue;
};

export type NpmLsDependenciesWithIssues = {
  [key: string]: NpmLsDependencyWithIssue;
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

export type NpmLsIssueType = "missing" | "invalid" | "extraneous";

export type NpmLsVersionType = "version" | "required";

export type NpmLsVersionProperty = {
  [key in NpmLsVersionType]: string;
};

export type NpmLsIssueProperty = {
  [key in NpmLsIssueType]: boolean | string;
};

export type NpmLsDependencyWithIssue = NpmLsIssueProperty &
  NpmLsVersionProperty;

export type NpmLsDependencyWithoutIssue = {
  version: string;
  resolved: string;
};

export type NpmLsDependency =
  | NpmLsDependencyWithIssue
  | NpmLsDependencyWithoutIssue;

export type VscodeOutputChannel = Pick<OutputChannel, "append">;
