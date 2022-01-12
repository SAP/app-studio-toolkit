import { endsWith } from "lodash";
import { isInsideNodeModules } from "../util";

export function shouldBeChecked(path: string): boolean {
  const isPkgJson = endsWith(path, "package.json");
  const isInNodeModules = isInsideNodeModules(path);
  const shouldBeChecked = isPkgJson && !isInNodeModules;
  return shouldBeChecked;
}
