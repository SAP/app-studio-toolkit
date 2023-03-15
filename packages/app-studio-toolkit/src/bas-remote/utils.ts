import { commands } from "vscode";
import { getLogger } from "../logger/logger";
import { getLandscapes } from "./landscape/landscape";
import { isEmpty } from "lodash";
import axios, { AxiosResponse, RawAxiosRequestHeaders } from "axios";
import { getHeaders } from "../auth/authentication";
import { URL } from "node:url";

// let timerStarted : number;
// let timerInterval : RefreshRate;
// let timerEnded : number;

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

// export function makeUrl(landscape: string, pathName: string, fragment?: string): string {
//   const url = new URL(landscape);
//   url.pathname = pathName;
//   url.hash = fragment ?? "";
//   return url.toString();
// }

// export enum wOP {
//   GET,
//   DELETE,
//   PUT,
//   POST,
// }

// export async function waccess(
//   op: wOP,
//   url: { landscape: string; path: string; fragment?: string; host?: string },
//   data?: unknown
// ): Promise<AxiosResponse<any, any>> {
//   const headers: unknown = await getHeaders(url.landscape);
//   if (isEmpty(headers)) {
//     throw new Error(`headers empty::unauthorized`);
//   }
//   const target = makeUrl(url.host ?? url.landscape, url.path, url.fragment);
//   const options = { headers: headers as RawAxiosRequestHeaders };
//   let promise: Promise<AxiosResponse<any, any>>;
//   switch (op) {
//     case wOP.GET:
//       promise = axios.get(target, options);
//       break;
//     case wOP.DELETE:
//       promise = axios.delete(target, options);
//       break;
//     case wOP.PUT:
//       promise = axios.put(target, data, options);
//       break;
//     case wOP.POST:
//       promise = axios.post(target, data, options);
//       break;
//   }
//   return promise;
// }
