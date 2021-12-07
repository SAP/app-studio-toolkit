/** Code that is used to associate package.json diagnostic entries with code actions. */
export const NPM_DEPENDENCY_ISSUES_CODE = "npm_dependency_issues";

export const FIX_ALL_ISSUES_COMMAND = "fix.all.dependency.issues.command";

// file that is not in node_modules
export const NOT_IN_NODE_MODULES_PATTERN =
  /^(?!.*[\\|\/]node_modules[\\|\/]).*[\\|\/].+/;
