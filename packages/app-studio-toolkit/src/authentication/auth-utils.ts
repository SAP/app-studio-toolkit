import { window } from "vscode";
import { getLogger } from "../logger/logger";
import { autoRefresh, RefreshRate } from "../bas-remote/utils";
import { authentication } from "@sap/bas-sdk";

const jwtCache = new Map<string, string>();
let jwtRemotePromise: Promise<string | undefined> = Promise.resolve(undefined);

interface Headers {
  Authorization: string;
  "x-approuter-authorization": string;
}

function isJwtExpired(jwt: string): boolean {
  const expired = authentication.getJwtExpiration(jwt);
  getLogger().info(`jwt expires at ${new Date(expired).toString()}`);
  return Date.now() >= expired;
}

function timeUntilJwtExpires(jwt: string): number {
  const untilExpired = authentication.getJwtExpiration(jwt) * 1000 - Date.now();
  getLogger().info(`jwt expires in ${untilExpired / 1000} seconds`);
  return untilExpired;
}

function sequentialRetriveRemote(
  landscapeUrl: string
): Promise<string | undefined> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- ignore
  return (jwtRemotePromise = jwtRemotePromise
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- ignore
    .then(() => authentication.retrieveJwt(landscapeUrl))
    .catch((e) => {
      throw e;
    }));
}

export async function getJwt(landscapeUrl: string): Promise<string> {
  if (hasJwt(landscapeUrl)) {
    getLogger().info(`jwt recieved from cache for ${landscapeUrl}`);
  } else {
    let jwt;
    getLogger().info(`retrieving jwt from remote for ${landscapeUrl}`);
    try {
      jwt = await sequentialRetriveRemote(landscapeUrl);
    } catch (e) {
      getLogger().error(e.toString());
      // void window.showErrorMessage(messages.err_incorrect_jwt(landscapeUrl));
    }
    if (jwt) {
      jwtCache.set(landscapeUrl, jwt);
      autoRefresh(RefreshRate.SEC_30, timeUntilJwtExpires(jwt));
    } else {
      throw new Error(
        `authorization token can't be obtained for landscape ${landscapeUrl}`
      );
    }
  }
  return jwtCache.get(landscapeUrl)!;
}

export function hasJwt(landscapeUrl: string): boolean {
  return (
    jwtCache.has(landscapeUrl) && !isJwtExpired(jwtCache.get(landscapeUrl)!)
  );
}
