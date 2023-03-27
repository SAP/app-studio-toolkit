import { authentication, env, Uri, window } from "vscode";
import express from "express";
import * as bodyParser from "body-parser";
import jwtDecode, { JwtPayload } from "jwt-decode";
import { getLogger } from "../logger/logger";
import { createHttpTerminator, HttpTerminator } from "http-terminator";
import { BasRemoteAuthenticationProvider } from "./authProvider";
import { core } from "@sap/bas-sdk";

const JWT_TIMEOUT = 60 * 1000; // 60s
const EXT_LOGIN_PORTNUM = 55532;

const serverCache = new Map<string, HttpTerminator>();
let jwtRemotePromise: Promise<string | undefined> = Promise.resolve(undefined);

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
      const jwt: string = request?.body?.jwt;
      if (jwt.startsWith("<html>")) {
        const message = `Incorrect token recieved for ${landscapeUrl}. Login failed`;
        getLogger().error(message);
        void window.showErrorMessage(message);
        response.send({ status: "error" });
        reject();
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
      const message = `Error listening to get jwt: ${err.message} for ${landscapeUrl}`;
      getLogger().error(message);
      void window.showErrorMessage(message);
      reject();
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
      const message = `Login time out in ${ms} ms.`;
      getLogger().error(message);
      reject(message);
    }, ms);
  });

  // Returns a race between our timeout and the passed in promise
  return Promise.race([promise, timeout]);
}

async function retrieveJwtFromRemote(
  landscapeUrl: string
): Promise<string | undefined> {
  // if server is not running already
  const jwtPromise = getJwtFromServerWithTimeout(
    JWT_TIMEOUT,
    getJwtFromServer(landscapeUrl)
  );

  const accepted = await loginToLandscape(landscapeUrl);
  // if user presses copy | cancel
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

export function retrieveJwt(landscapeUrl: string): Promise<string | undefined> {
  return (jwtRemotePromise = jwtRemotePromise
    .then(() => retrieveJwtFromRemote(landscapeUrl))
    .catch((e) => {
      throw e;
    }));
}

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
