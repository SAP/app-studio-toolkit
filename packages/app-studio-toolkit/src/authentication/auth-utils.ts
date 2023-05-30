import { authentication, env, Uri, window } from "vscode";
import jwtDecode, { JwtPayload } from "jwt-decode";
import { getLogger } from "../logger/logger";
import { BasRemoteAuthenticationProvider } from "./authProvider";
import { core } from "@sap/bas-sdk";
import { messages } from "../../src/devspace-manager/common/messages";
import {
  eventEmitter,
  LoginEvent,
} from "../../src/devspace-manager/handler/basHandler";

export const JWT_TIMEOUT = 60 * 1000; // 60s

function getJwtExpiration(jwt: string): number {
  const decodedJwt: JwtPayload = jwtDecode<JwtPayload>(jwt);
  return (
    (decodedJwt.exp ??
      /* istanbul ignore next: test's dummy jwt always has 'exp' attribute */ 0) *
    1000
  );
}

function isJwtExpired(jwt: string): boolean {
  const expired = getJwtExpiration(jwt);
  getLogger().info(`jwt expires at ${new Date(expired).toString()}`);
  return Date.now() >= expired;
}

export function timeUntilJwtExpires(jwt: string): number {
  const untilExpired = getJwtExpiration(jwt) - Date.now();
  getLogger().info(`jwt expires in ${untilExpired / 1000} seconds`);
  return untilExpired;
}

async function loginToLandscape(landscapeUrl: string): Promise<boolean> {
  return env.openExternal(Uri.parse(core.getExtLoginPath(landscapeUrl)));
}

async function getJwtFromServer(landscapeUrl: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    // Subscribe the listener to the event
    const listener = eventEmitter.event(handleEvent);

    // Listener function to resolve the promise when the event is received
    function handleEvent(event: LoginEvent): void {
      if (event.jwt?.toLocaleLowerCase().startsWith("<html>")) {
        reject(new Error(messages.err_incorrect_jwt(landscapeUrl)));
      } else {
        resolve(event.jwt ?? "");
      }
      // Remove the listener after resolving the promise
      listener.dispose();
    }
  });
}

async function getJwtFromServerWithTimeout(
  ms: number,
  promise: Promise<string>
): Promise<string> {
  // Create a promise that rejects in <ms> milliseconds
  const timeout = new Promise<string>((resolve, reject) => {
    const delay = setTimeout(() => {
      clearTimeout(delay);
      reject(new Error(messages.err_get_jwt_timeout(ms)));
    }, ms);
  });

  // Returns a race between our timeout and the passed in promise
  return Promise.race([promise, timeout]);
}

async function retrieveJwtFromRemote(
  landscapeUrl: string
): Promise<string | undefined> {
  const jwtPromise = getJwtFromServerWithTimeout(
    JWT_TIMEOUT,
    getJwtFromServer(landscapeUrl)
  );

  const accepted = await loginToLandscape(landscapeUrl);
  // browser open not accepted
  if (!accepted) {
    void closeListener(Promise.reject(new Error("canceled")));
  }
  return jwtPromise.finally(() => void closeListener(jwtPromise));
}

async function closeListener(promise: Promise<string>): Promise<void> {
  // dispose the login event listener in case of :
  //   1. open browser is canceled or disallowed
  //   2. login timeout occured
  if (
    // confirm promise is rejected
    await promise
      .then(() => false)
      .catch((e) => {
        return !e.message.startsWith(
          messages.err_incorrect_jwt("").split(" ").slice(0, 3).join(" ")
        );
      })
  ) {
    eventEmitter.fire({});
  }
  getLogger().info(`closing listener`);
}

export function retrieveJwt(landscapeUrl: string): Promise<string | void> {
  return retrieveJwtFromRemote(landscapeUrl).catch((e) => {
    void window.showErrorMessage(e.message);
    getLogger().error(e.toString());
  });
}

export async function getJwt(landscapeUrl: string): Promise<string> {
  const session = await authentication.getSession(
    BasRemoteAuthenticationProvider.id,
    [landscapeUrl]
  );
  if (session?.accessToken) {
    return session.accessToken;
  } else {
    getLogger().debug(messages.err_get_jwt_not_exists);
    throw new Error(messages.err_get_jwt_not_exists);
  }
}

export async function hasJwt(landscapeUrl: string): Promise<boolean> {
  return getJwt(landscapeUrl)
    .then((jwt) => !isJwtExpired(jwt))
    .catch((_) => false);
}
