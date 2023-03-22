import { authentication, window } from "vscode";
import { getLogger } from "../logger/logger";
import { autoRefresh, RefreshRate } from "../devspace-manager/utils";
import * as bassdk from "@sap/bas-sdk";
import { BasRemoteAuthenticationProvider } from "./authProvider";
import { isEmpty } from "lodash";

function isJwtExpired(jwt: string): boolean {
  const expired = bassdk.authentication.getJwtExpiration(jwt);
  getLogger().info(`jwt expires at ${new Date(expired).toString()}`);
  return Date.now() >= expired;
}

// function timeUntilJwtExpires(jwt: string): number {
//   const untilExpired =
//     bassdk.authentication.getJwtExpiration(jwt) * 1000 - Date.now();
//   getLogger().info(`jwt expires in ${untilExpired / 1000} seconds`);
//   return untilExpired;
// }

export async function getJwt(landscapeUrl: string): Promise<string> {
  const session = await authentication.getSession(
    BasRemoteAuthenticationProvider.id,
    [landscapeUrl]
  );
  if (session?.accessToken) {
    return session.accessToken;
  } else {
    throw new Error("PAT not exists");
  }
}

export async function hasJwt(landscapeUrl: string): Promise<boolean> {
  return getJwt(landscapeUrl)
    .then((jwt) => !isJwtExpired(jwt))
    .catch((_) => false);
}
