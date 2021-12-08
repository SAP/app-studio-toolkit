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
  "@noCallThru": true,
};

export const eventUtilProxy = {
  handlePackageJsonEvent() {
    return Promise.reject("handlePackageJsonEvent method is not implemented");
  },
  "@noCallThru": true,
};
