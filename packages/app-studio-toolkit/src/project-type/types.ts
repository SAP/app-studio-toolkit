import { ProjectApi } from "@sap/artifact-management";
import { TagKey } from "@sap-devx/app-studio-toolkit-types";

export type AbsolutePath = string;

export type TagToAbsPaths = Map<TagKey, AbsolutePathFlags>;
export type AbsolutePathFlags = Map<AbsolutePath, boolean>;

export type SetContext = (contextName: string, paths: string[]) => void;

export type ProjectApiRead = Pick<ProjectApi, "read">;
