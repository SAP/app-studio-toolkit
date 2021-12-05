/** Code that is used to associate package.json diagnostic entries with code actions. */
export const NPM_DEPENDENCY_ISSUES_CODE = "npm_dependency_issues";

export const FIX_ALL_ISSUES_COMMAND = "fix.all.dependency.issues.command";

// package.json files that are not in node_modules
export const PACKAGE_JSON_PATTERN =
  /^(?!.*[\\|\/]node_modules[\\|\/]).*[\\|\/]package\.json$/;
