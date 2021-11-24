import { getLogger } from "../logger/logger";
import { getParameter } from "./parameters";
import { includes } from "lodash";

export async function isOpenedForAction(): Promise<boolean | undefined> {
  const logger = getLogger().getChildLogger({ label: "isOpenedForAction" });

  const pkgActionKey = "pkg-action";
  const pkgActionParam = await getParameter(pkgActionKey);
  if (pkgActionParam === undefined) {
    logger.trace(`Package action does not exist!`);
    return undefined;
  }
  const pkgActionValues = ["release", "deploy", "remove"];
  if (includes(pkgActionValues, pkgActionParam)) {
    logger.trace(`Package action exists! The action is: '${pkgActionParam}'`);
    return true;
  }
  logger.trace(
    `The value '${pkgActionParam}' of pkg-action parameter is invalid!`
  );
  return false;
}
