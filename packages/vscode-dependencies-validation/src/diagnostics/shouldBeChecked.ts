import { endsWith } from "lodash";
import { isInsideNodeModules } from "../util";
import { getLogger } from "../logger/logger";

const logger = getLogger().getChildLogger({ label: "shouldBeChecked" });

export function shouldBeChecked(path: string): boolean {
  const isPkgJson = endsWith(path, "package.json");
  const isInNodeModules = isInsideNodeModules(path);
  const shouldBeChecked = isPkgJson && !isInNodeModules;

  logger.trace(`${path} shouldBeChecked: ${shouldBeChecked}`);

  return shouldBeChecked;
}
