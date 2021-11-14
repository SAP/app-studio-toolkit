export type ProblemType = "missing" | "invalid" | "extraneous";

export type ProblematicDependency = {
  name: string;
  version: string;
  problemType: ProblemType;
  isDevDependency?: boolean;
};
