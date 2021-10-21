import { ProjectApi } from "@sap/artifact-management";

export type ProjectTypeTag = string;
export type AbsolutePath = string;

export type TagToAbsPaths = Map<ProjectTypeTag, AbsolutePathFlags>;
export type AbsolutePathFlags = Map<AbsolutePath, boolean>;

export type SetContext = (contextName: string, paths: string[]) => void;

export type ProjectApiRead = Pick<ProjectApi, "read">;
