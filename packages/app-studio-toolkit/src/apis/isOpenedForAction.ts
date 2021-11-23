import { getLogger } from "../logger/logger";
import { getParameter } from "./parameters";

export async function isOpenedForAction(): Promise<boolean | undefined> {
  const logger = getLogger().getChildLogger({ label: "isOpenedForAction" });

  const pkgActionParam = await getParameter("pkg-action");
  if (pkgActionParam === undefined) {
      logger.trace(`Package action does not exist!`);
      return undefined;
  }
  if (pkgActionParam === 'release' || pkgActionParam === 'deploy' || pkgActionParam === 'remove') {
      logger.trace(`Package action exists! The action is: '${pkgActionParam}'`);
      return true;
  }
  logger.trace(`The value '${pkgActionParam}' of pkg-action parameter is invalid!`);
  return false;
}
