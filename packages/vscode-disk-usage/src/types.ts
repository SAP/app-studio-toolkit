export type ExtConfig = {
  disable: boolean;
  initialDelay: number;
  daysBetweenRuns: number;
};

export type DiskUsageReport = {
  timestamp: number;
  workspaceId: string;
  // Size (recursive) of all `node_modules` folders in the home folder:
  allNodeModules: number;
  // Size of none hidden (dot) folders in `home/user`
  // The assumption is that this represents end user data size
  allNoneHidden: number;
  // Size of all `redhat.java` folders inside `workspaceStorage`, e.g.:
  // /home/user/.vscode/data/User/workspaceStorage/-580716d0/redhat.java/*
  // - note `-580716d0` is variable
  allJavaRedHat: number;
  knownHomeFolders: KnownHomeFoldersReport;
};

export type KnownHomeFoldersReport = {
  dot: number;
  projects: number;
  dot_ui5: number;
  dot_continue: number;
  dot_m2: number;
  dot_node_modules_global: number;
  "dot_asdf-inst": number;
  dot_nvm: number;
  "dot_vscode-server": number;
  dot_fioritools: number;
  dot_yarn: number;
};
