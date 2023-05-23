import { authentication, env, Uri, window } from "vscode";
import express from "express";
import cors from "cors";
import * as bodyParser from "body-parser";
import jwtDecode, { JwtPayload } from "jwt-decode";
import { getLogger } from "../logger/logger";
import { createHttpTerminator, HttpTerminator } from "http-terminator";
import { BasRemoteAuthenticationProvider } from "./authProvider";
import { core } from "@sap/bas-sdk";
import { messages } from "../../src/devspace-manager/common/messages";

export const JWT_TIMEOUT = 60 * 1000; // 60s
const EXT_LOGIN_PORTNUM = 55532;

const serverCache = new Map<string, HttpTerminator>();

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
  return env.openExternal(
    Uri.parse(`${core.getExtLoginPath(landscapeUrl)}&iframe=src`)
  );
}

async function getJwtFromServer(landscapeUrl: string): Promise<string> {
  /* istanbul ignore next */
  return new Promise<string>((resolve, reject) => {
    const app = express();

    app.use(cors());

    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());

    app.post("/remote-login", function (request, response) {
      const stubValue = `__value__`;
      const htmlTemplate = `<html><script>window.parent.postMessage( ${stubValue} , "*");</script><body/></html>`;
      const jwt: string | undefined = request?.body?.workspace_jwt;
      if (!jwt || jwt.startsWith("<html>")) {
        response.send(
          htmlTemplate.replace(stubValue, JSON.stringify({ status: "error" }))
        );
        reject(new Error(messages.err_incorrect_jwt(landscapeUrl)));
      } else {
        getLogger().info(`jwt recieved from remote for ${landscapeUrl}`);
        response.send(
          htmlTemplate.replace(stubValue, JSON.stringify({ status: "ok" }))
        );
        resolve(jwt);
      }
    });

    const server = app.listen(EXT_LOGIN_PORTNUM, () => {
      getLogger().info(
        `CORS-enabled web server listening to get jwt for ${landscapeUrl}`
      );
    });

    server.on("error", function (err) {
      reject(new Error(messages.err_listening(err.message, landscapeUrl)));
    });

    serverCache.set(landscapeUrl, createHttpTerminator({ server }));
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
  // browser open failed
  if (!accepted) {
    void closeServer(landscapeUrl);
    return;
  }
  return jwtPromise.finally(() => void closeServer(landscapeUrl));
}

/* istanbul ignore next */
async function closeServer(landscapeUrl: string): Promise<void> {
  await serverCache.get(landscapeUrl)?.terminate();
  serverCache.delete(landscapeUrl);
  getLogger().info(`closing server for ${landscapeUrl}`);
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
