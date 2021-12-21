export const diagnosticsProxy = {
  refreshDiagnostics() {
    return Promise.reject("refreshDiagnostics method is not implemented");
  },
  "@noCallThru": true,
};

export const npmDepsValidationProxy = {
  invokeNPMCommand() {
    return Promise.reject("invokeNPMCommand method is not implemented");
  },
  findDependencyIssues() {
    return Promise.reject("findDependencyIssues method is not implemented");
  },
  isPathExist() {
    return Promise.reject("isPathExist method is not implemented");
  },
  "@noCallThru": true,
};

export const eventUtilProxy = {
  debouncedHandleProjectChange() {
    return Promise.reject(
      "debouncedHandleProjectChange method is not implemented"
    );
  },
  "@noCallThru": true,
};

export const configurationProxy = {
  isAutoFixEnabled() {
    throw new Error("configurationProxy method is not implemented");
  },
  "@noCallThru": true,
};

export const utilProxy = {
  findAndFixDepsIssues() {
    return Promise.reject("findAndFixDepsIssues method is not implemented");
  },
  clearDiagnostics() {
    throw new Error("clearDiagnostics method is not implemented");
  },
  fixDepsIssues() {
    return Promise.reject("fixDepsIssues method is not implemented");
  },
};
