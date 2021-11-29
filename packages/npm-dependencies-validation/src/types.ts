import { OutputChannel } from "vscode";

export type NPMDependencyIssue = {
  name: string;
  version: string;
  type: NpmLsIssueType;
  devDependency: boolean;
} & NpmLsProblemsProperty;

export type NpmLsResult = {
  name: string;
  version: string;
  dependencies: NpmLsDependencies;
} & NpmLsProblemsProperty;

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

export interface NpmLsProblemsProperty {
  problems: string[];
}

export type NpmLsDependencyWithIssue = NpmLsProblemsProperty &
  NpmLsIssueProperty &
  NpmLsVersionProperty;

export type NpmLsDependencyWithoutIssue = {
  version: string;
  resolved: string;
};

export type NpmLsDependency =
  | NpmLsDependencyWithIssue
  | NpmLsDependencyWithoutIssue;

export type VscodeOutputChannel = Pick<OutputChannel, "append">;
