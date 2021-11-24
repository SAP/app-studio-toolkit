// TODO: I think we can get rid of dependency to VSCode
import { Uri, WorkspaceFolder } from "vscode";

export type NPMIssueType = "missing" | "invalid" | "extraneous";

export type Version = "required" | "version";

export type NPMDependencyIssue = {
  name: string;
  version?: string;
  type: NPMIssueType;
  devDependency?: boolean;
};

export type VscodeWsFolder = Pick<WorkspaceFolder, "uri">;

export type VscodeUri = Pick<Uri, "fsPath">;

export type NpmLsRDependencies = {
  name: string;
  version: string;
  dependencies: Dependencies;
};

export type Dependencies = {
  [key: string]: Dependency;
};

export type Dependency = IssueTypeProperty & VersionProperty;

export type VersionProperty = {
  [key in Version]?: string;
};

export type IssueTypeProperty = {
  [key in NPMIssueType]?: boolean;
};
