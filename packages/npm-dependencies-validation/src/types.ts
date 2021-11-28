export type NPMDependencyIssue = {
  name: string;
  version: string;
  type: NPMIssueType;
  devDependency?: boolean;
};

export type NpmLsDependencies = {
  name: string;
  version: string;
  dependencies: {
    [key: string]: NPMDependencyWithIssue;
  };
} & DependencyIssueProblems;

export type DependenciesPropertyName = "dependencies" | "devDependencies";

export type PackageJson = {
  name: string;
} & DependenciesProperties;

export type DependenciesProperties = {
  [key in DependenciesPropertyName]?: {
    [key: string]: string;
  };
};

export type InvalidDependency = {
  version: string;
  invalid: boolean | string;
} & DependencyIssueProblems;

export type MissingDependency = {
  required: string;
  missing: boolean;
} & DependencyIssueProblems;

export type ExtraneousDependency = {
  version: string;
  extraneous: boolean;
} & DependencyIssueProblems;

export type NPMIssueType = "missing" | "invalid" | "extraneous";

export type DependencyIssueProblems = {
  problems: string[];
};

export type NPMDependencyWithIssue =
  | InvalidDependency
  | MissingDependency
  | ExtraneousDependency;
