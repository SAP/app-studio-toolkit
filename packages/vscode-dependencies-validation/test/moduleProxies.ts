export const diagnosticsProxy = {
  refreshDiagnostics() {
    return Promise.reject("refreshDiagnostics method is not implemented");
  },
  "@noCallThru": true,
};

export const npmDepsValidationProxy = {
  fixDependencyIssues() {
    return Promise.reject("fixDependencyIssues method is not implemented");
  },
  findDependencyIssues() {
    return Promise.reject("findDependencyIssues method is not implemented");
  },
  "@noCallThru": true,
};

export const eventUtilProxy = {
  debouncedHandlePkgJsonAutoFix() {
    return Promise.reject(
      "debouncedHandlePkgJsonAutoFix method is not implemented"
    );
  },
  "@noCallThru": true,
};

export const configurationProxy = {
  isAutoFixEnabled() {
    throw new Error("isAutoFixEnabled method is not implemented");
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
};

export const loggerProxyObject = {
  info(): any {
    throw new Error("info method is not implemented");
  },
  trace(): any {
    throw new Error("trace method is not implemented");
  },
};

export const loggerProxy = {
  getLogger() {
    return {
      getChildLogger: () => loggerProxyObject,
    };
  },
  "@noCallThru": true,
};
