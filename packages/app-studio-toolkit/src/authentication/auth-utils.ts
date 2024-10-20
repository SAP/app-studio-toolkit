import { authentication, env, Uri, window } from "vscode";
import express from "express";
import cors from "cors";
import * as bodyParser from "body-parser";
import { createHttpTerminator, HttpTerminator } from "http-terminator";
import { platform } from "os";
import { getLogger } from "../logger/logger";
import { BasRemoteAuthenticationProvider } from "./authProvider";
import { core, helpers } from "@sap/bas-sdk";
import { messages } from "../../src/devspace-manager/common/messages";
import {
  eventEmitter,
  LoginEvent,
} from "../../src/devspace-manager/handler/basHandler";

export const JWT_TIMEOUT = 60 * 1000; // 60s
const EXT_LOGIN_PORTNUM = 55532;

const serverCache = new Map<string, HttpTerminator>();

/**
 * Decides which method is used for the login procedure: `vscode` or `express (http)`
 * @returns true in case of `vscode`
 */
function isVscode(): boolean {
  // currently `vscode` is only used for `mac` platform
  return platform() === "darwin";
}

async function expressGetJwtFromServer(landscapeUrl: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const app = express();

    app.use(cors());

    app.use(bodyParser.urlencoded({ extended: false }));
    app.use(bodyParser.json());

    app.post("/ext-login", function (request, response) {
      const jwt: string | undefined = request?.body?.jwt;
      if (!jwt || jwt.startsWith("<html>")) {
        response.send({ status: "error" });
        reject(new Error(messages.err_incorrect_jwt(landscapeUrl)));
      } else {
        getLogger().info(`jwt recieved from remote for ${landscapeUrl}`);
        response.send({ status: "ok" });
        resolve(jwt);
      }
    });

    /* istanbul ignore next */
    const server = app.listen(EXT_LOGIN_PORTNUM, () => {
      getLogger().info(
        `CORS-enabled web server listening to get jwt for ${landscapeUrl}`
      );
    });

    server.on("error", function (err: { message: string }) {
      reject(new Error(messages.err_listening(err.message, landscapeUrl)));
    });

    serverCache.set(landscapeUrl, createHttpTerminator({ server }));
  });
}

/* istanbul ignore next */
async function expressCloseListener(landscapeUrl: string): Promise<void> {
  await serverCache.get(landscapeUrl)?.terminate();
  serverCache.delete(landscapeUrl);
  getLogger().info(`closing server for ${landscapeUrl}`);
}

async function vscodeCloseListener(promise?: Promise<string>): Promise<void> {
  promise = promise || Promise.reject(new Error("canceled"));
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

async function vscodeGetJwtFromServer(landscapeUrl: string): Promise<string> {
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

async function onJwtReceived(opt: {
  accepted: boolean;
  jwtPromise: Promise<string>;
  landscapeUrl: string;
}): Promise<void> {
  return isVscode()
    ? vscodeCloseListener(opt.jwtPromise)
    : expressCloseListener(opt.landscapeUrl);
}

async function loginToLandscape(landscapeUrl: string): Promise<boolean> {
  return env.openExternal(
    Uri.parse(core.getExtLoginPath(landscapeUrl, isVscode()))
  );
}

async function getJwtFromServer(landscapeUrl: string): Promise<string> {
  return isVscode()
    ? vscodeGetJwtFromServer(landscapeUrl)
    : expressGetJwtFromServer(landscapeUrl);
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

  return receiveJwt({
    accepted: await loginToLandscape(landscapeUrl),
    jwtPromise,
    landscapeUrl,
  });
}

async function receiveJwt(opt: {
  accepted: boolean;
  jwtPromise: Promise<string>;
  landscapeUrl: string;
}): Promise<string | undefined> {
  // browser open not accepted
  if (!opt.accepted) {
    if (isVscode()) {
      void vscodeCloseListener();
    } else {
      void expressCloseListener(opt.landscapeUrl);
      return; // not waiting for jwtPromise fulfilled
    }
  }
  return opt.jwtPromise.finally(() => void onJwtReceived(opt));
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
    .then((jwt) => !helpers.isJwtExpired(jwt))
    .catch((_) => false);
}
