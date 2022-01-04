export type NpmLsResult = {
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

export interface OutputChannel {
  append: (message: string) => void;
}

export type NpmCommandConfig = {
  cwd: string;
  commandArgs: string[];
};

export type FilePaths = {
  filePath: string;
  dirPath: string;
};
