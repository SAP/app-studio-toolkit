import { commands } from "vscode";
import { getLogger } from "../logger/logger";
import { getLandscapes } from "./landscape/landscape";
import { isEmpty } from "lodash";

export enum RefreshRate {
  ALWAYS = -1,
  SEC_5 = 5 * 1000,
  SEC_10 = 10 * 1000,
  SEC_15 = 15 * 1000,
  SEC_30 = 30 * 1000,
  MIN_2 = 2 * 60 * 1000,
  MIN_3 = 3 * 60 * 1000,
}

export function autoRefresh(refreshRate: number, timeOut: number): void {
  let refreshedTime = 0;
  // timerStarted = Date.now();
  // timerInterval = refreshRate;
  // timerEnded = Date.now() + timoOut
  const refreshInterval: NodeJS.Timer = setInterval(() => {
    getLandscapes()
      .then((landscapes) => {
        if ((timeOut < 0 || refreshedTime < timeOut) && !isEmpty(landscapes)) {
          getLogger().info(`Auto refresh ${refreshedTime} out of ${timeOut}`);
          void commands.executeCommand("local-extension.tree.refresh");
        } else {
          getLogger().info(`Auto refresh completed`);
          clearInterval(refreshInterval);
        }
        refreshedTime += refreshRate;
      })
      .catch((e) => {
        getLogger().error(`getLandscapes error: ${e.toString()}`);
      });
  }, refreshRate);
}
