export type IssueType = "missing" | "invalid" | "extraneous";

export type DependencyIssue = {
  name: string;
  version: string;
  type: IssueType;
  devDependency?: boolean;
};
