import { endsWith } from "lodash";
import { isInsideNodeModules } from "../util";

export function shouldBeChecked(path: string): boolean {
  const isPkgJson = endsWith(path, "package.json");
  // TODO: is inside node_modules needed in the diagnostics flow?
  const isInNodeModules = isInsideNodeModules(path);
  return isPkgJson && !isInNodeModules;
}
