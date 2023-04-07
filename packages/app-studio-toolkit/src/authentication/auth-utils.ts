import { authentication, env, Uri, window } from "vscode";
import express from "express";
import * as bodyParser from "body-parser";
import jwtDecode, { JwtPayload } from "jwt-decode";
import { getLogger } from "../logger/logger";
import { createHttpTerminator, HttpTerminator } from "http-terminator";
import { BasRemoteAuthenticationProvider } from "./authProvider";
import { core } from "@sap/bas-sdk";

export const JWT_TIMEOUT = 60 * 1000; // 60s
const EXT_LOGIN_PORTNUM = 55532;

const serverCache = new Map<string, HttpTerminator>();

enum eHeaders {
  "Access-Control-Allow-Origin" = "Access-Control-Allow-Origin",
  "Access-Control-Allow-Methods" = "Access-Control-Allow-Methods",
  "Access-Control-Allow-Headers" = "Access-Control-Allow-Headers",
  "Access-Control-Allow-Credentials" = "Access-Control-Allow-Credentials",
}

function isJwtExpired(jwt: string): boolean {
  const decodedJwt: JwtPayload = jwtDecode<JwtPayload>(jwt);
  const expired = (decodedJwt.exp ?? 0) * 1000;
  getLogger().info(`jwt expires at ${new Date(expired).toString()}`);
  return Date.now() >= expired;
}

export function timeUntilJwtExpires(jwt: string): number {
  const decodedJwt: JwtPayload = jwtDecode<JwtPayload>(jwt);
  const untilExpired = (decodedJwt.exp ?? 0) * 1000 - Date.now();
  getLogger().info(`jwt expires in ${untilExpired / 1000} seconds`);
  return untilExpired;
}

async function loginToLandscape(landscapeUrl: string): Promise<boolean> {
  return env.openExternal(Uri.parse(core.getExtLoginPath(landscapeUrl)));
}

async function getJwtFromServer(landscapeUrl: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const app = express();

    app.use(function (req, res, next) {
      res.setHeader(eHeaders["Access-Control-Allow-Origin"], `${landscapeUrl}`);
      res.setHeader(
        eHeaders["Access-Control-Allow-Methods"],
        "GET, POST, OPTIONS, PUT, PATCH, DELETE"
      );
      res.setHeader(
        eHeaders["Access-Control-Allow-Headers"],
        "X-Requested-With,content-type"
      );
      res.setHeader(eHeaders["Access-Control-Allow-Credentials"], "true");
      res.header(eHeaders["Access-Control-Allow-Origin"], "*");
      next();
    });
    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());

    app.options("/ext-login", function (req, res, next) {
      res.header(eHeaders["Access-Control-Allow-Origin"], "*");
      res.header(
        eHeaders["Access-Control-Allow-Methods"],
        "GET,PUT,POST,DELETE,OPTIONS"
      );
      res.header(
        eHeaders["Access-Control-Allow-Headers"],
        "Content-Type, Authorization, Content-Length, X-Requested-With"
      );
      res.sendStatus(200);
    });

    app.post("/ext-login", function (request, response) {
      const jwt: string | undefined = request?.body?.jwt;
      if (!jwt || jwt.startsWith("<html>")) {
        response.send({ status: "error" });
        reject(
          new Error(
            `Incorrect token recieved for ${landscapeUrl}. Login failed`
          )
        );
      } else {
        getLogger().info(`jwt recieved from remote for ${landscapeUrl}`);
        response.send({ status: "ok" });
        resolve(jwt);
      }
    });

    const server = app.listen(EXT_LOGIN_PORTNUM, () => {
      getLogger().info(`Listening to get jwt for ${landscapeUrl}`);
    });

    server.on("error", function (err) {
      reject(
        new Error(
          `Error listening to get jwt: ${err.message} for ${landscapeUrl}`
        )
      );
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
      reject(new Error(`Login time out in ${ms} ms.`));
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

async function closeServer(landscapeUrl: string): Promise<void> {
  await serverCache.get(landscapeUrl)!.terminate();
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
    const message = `PAT not exists`;
    getLogger().debug(message);
    throw new Error(message);
  }
}

export async function hasJwt(landscapeUrl: string): Promise<boolean> {
  return getJwt(landscapeUrl)
    .then((jwt) => !isJwtExpired(jwt))
    .catch((_) => false);
}
