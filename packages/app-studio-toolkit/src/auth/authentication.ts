import { env, Uri, window } from "vscode";
import express from "express";
import * as bodyParser from "body-parser";
import jwtDecode, { JwtPayload } from "jwt-decode";
import { getLogger } from "../logger/logger";
import { createHttpTerminator, HttpTerminator } from "http-terminator";
import { isEmpty } from "lodash";
import { messages } from "../bas-remote/messages";
import { autoRefresh, RefreshRate } from "../bas-remote/utils";

const JWT_TIMEOUT = 60 * 1000; // 60s

const jwtCache = new Map<string, string>();
const serverCache = new Map<string, HttpTerminator>();
let jwtRemotePromise = Promise.resolve();

enum eHeaders {
  "Access-Control-Allow-Origin" = "Access-Control-Allow-Origin",
  "Access-Control-Allow-Methods" = "Access-Control-Allow-Methods",
  "Access-Control-Allow-Headers" = "Access-Control-Allow-Headers",
  "Access-Control-Allow-Credentials" = "Access-Control-Allow-Credentials",
}

interface Headers {
  Authorization: string;
  "x-approuter-authorization": string;
}

function isJwtExpired(jwt: string): boolean {
  const decodedJwt: JwtPayload = jwtDecode<JwtPayload>(jwt);
  const expired = (decodedJwt.exp ?? 0) * 1000;
  getLogger().info(`jwt expires at ${new Date(expired).toString()}`);
  return Date.now() >= expired;
}

function timeUntilJwtExpires(jwt: string): number {
  const decodedJwt: JwtPayload = jwtDecode<JwtPayload>(jwt);
  const untilExpired = (decodedJwt.exp ?? 0) * 1000 - Date.now();
  getLogger().info(`jwt expires in ${untilExpired / 1000} seconds`);
  return untilExpired;
}

async function loginToLandscape(landscapeUrl: string): Promise<boolean> {
  return env.openExternal(
    Uri.parse(
      `${landscapeUrl}/ext-login.html?cb=${Math.floor(Math.random() * 100000)}`
    )
  );
}

async function getJwtFromServer(
  landscapeUrl: string,
  port: number
): Promise<string> {
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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- ignore
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
        const message = messages.err_incorrect_jwt(landscapeUrl);
        getLogger().error(message);
        void window.showErrorMessage(message);
        response.send({ status: "error" });
        reject();
      } else {
        getLogger().info(`jwt recieved from remote for ${landscapeUrl}`);
        response.send({ status: "ok" });
        jwtCache.set(landscapeUrl, jwt);
        autoRefresh(RefreshRate.SEC_30, timeUntilJwtExpires(jwt));
        resolve("");
      }
    });

    const server = app.listen(port, () => {
      getLogger().info(
        `Listening on port ${port} to get jwt for ${landscapeUrl}`
      );
    });

    server.on("error", function (err) {
      const message = messages.err_listening(port, err.message, landscapeUrl);
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
      const message = messages.err_get_jwt_timeout(ms);
      getLogger().error(message);
      reject(message);
    }, ms);
  });

  // Returns a race between our timeout and the passed in promise
  return Promise.race([promise, timeout]);
}

async function retrieveJwtFromRemote(landscapeUrl: string): Promise<void> {
  const port = 55532;
  // if server is not running already
  const jwtPromise = getJwtFromServerWithTimeout(
    JWT_TIMEOUT,
    getJwtFromServer(landscapeUrl, port)
  ).catch(() => null);

  const accepted = await loginToLandscape(landscapeUrl);
  // if user presses copy | cancel
  if (!accepted) {
    const message = messages.txt_login_canceled(landscapeUrl);
    getLogger().info(message);
    void window.showInformationMessage(message);
    if (serverCache.has(landscapeUrl)) {
      await closeServer(port, landscapeUrl);
    }
    return;
  }

  await jwtPromise;
  await closeServer(port, landscapeUrl);

  if (!jwtCache.has(landscapeUrl)) {
    const message = messages.err_authentication(landscapeUrl);
    getLogger().error(message);
    void window.showErrorMessage(message);
  }
}

async function closeServer(port: number, landscapeUrl: string): Promise<void> {
  await serverCache.get(landscapeUrl)!.terminate();
  serverCache.delete(landscapeUrl);
  getLogger().info(`closing server on port ${port} for ${landscapeUrl}`);
}

function sequentialRetriveRemote(landscapeUrl: string): Promise<void> {
  return (jwtRemotePromise = jwtRemotePromise
    .then(() => retrieveJwtFromRemote(landscapeUrl))
    .catch((e) => {
      throw e;
    }));
}

export async function getJwt(
  landscapeUrl: string
): Promise<string | undefined> {
  if (hasJwt(landscapeUrl)) {
    getLogger().info(`jwt recieved from cache for ${landscapeUrl}`);
  } else {
    getLogger().info(`retrieving jwt from remote for ${landscapeUrl}`);
    await sequentialRetriveRemote(landscapeUrl);
  }
  return jwtCache.get(landscapeUrl);
}

export async function getHeaders(landscapeUrl: string): Promise<Headers> {
  const jwt = await getJwt(landscapeUrl);
  if (isEmpty(jwt)) {
    return {} as Headers;
  }

  return {
    Authorization: `bearer ${jwt}`,
    "x-approuter-authorization": `bearer ${jwt}`,
  };
}
export function hasJwt(landscapeUrl: string): boolean {
  return (
    jwtCache.has(landscapeUrl) && !isJwtExpired(jwtCache.get(landscapeUrl)!)
  );
}
