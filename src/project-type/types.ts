export type ProjectTypeTag = string;
export type AbsolutePath = string;

export type TagToAbsPaths = Map<ProjectTypeTag, AbsolutePathFlags>;
export type AbsolutePathFlags = Map<AbsolutePath, boolean>;
