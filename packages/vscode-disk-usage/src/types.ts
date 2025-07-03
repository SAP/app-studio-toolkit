export type ExtConfig = {
  disable: boolean;
  initialDelay: number;
  daysBetweenRuns: number;
};

export type DiskUsageReport = {
  timestamp: number;
  allNodeModules: number;
  allNoneHidden: number;
  allJavaRedHat: number;
  KnownTechnicalFolders: KnownTechnicalFoldersReport;
};

export type KnownTechnicalFoldersReport = {
  "~/.ui5": number;
  "~/.continue": number;
  "~/.m2": number;
  "~/.node_modules_global": number;
  "~/.asdf-inst": number;
};
