import {
  CancellationToken,
  ExtensionKind,
  ProgressLocation,
  Uri,
  commands,
  env,
  extensions,
  window,
  workspace,
} from "vscode";
import { join, split, tail } from "lodash";
import { devspace } from "@sap/bas-sdk";
import { URL } from "node:url";
import { getLogger } from "../logger/logger";
import {
  BAS_KEEP_ALIVE_FILE,
  EXTEND_SESSION_TIMEOUT,
  KEEP_ALIVE_TIMEOUT,
  MAX_SESSION_TIME,
} from "../constants";

export enum ExtensionRunMode {
  desktop = `desktop`,
  basRemote = `bas-remote`,
  basWorkspace = `bas-workspace`,
  basUi = `bas-ui`,
  wsl = `wsl`,
  unexpected = `unexpected`,
}

export function shouldRunCtlServer(): boolean {
  const platform = getExtensionRunPlatform();

  // view panel visibility expects that value is available
  void commands.executeCommand("setContext", `ext.runPlatform`, platform);

  return (
    platform === ExtensionRunMode.basWorkspace || // BAS
    platform === ExtensionRunMode.basRemote || // hybrid (through ssh-remote)
    devspace.getBasMode() === "personal-edition" // personal edition
  );
}

export function getExtensionRunPlatform(
  extensionName?: string
): ExtensionRunMode {
  let runPlatform: ExtensionRunMode = ExtensionRunMode.unexpected;
  const serverUri = process.env.WS_BASE_URL;
  // see example: https://github.com/microsoft/vscode/issues/74188
  // expected values of env.remoteName: `undefined` (locally), `ssh-remote` (bas-remote) or `landscape.url` (BAS)
  if (serverUri && typeof env.remoteName === "string") {
    const remote = join(tail(split(env.remoteName, ".")), ".");
    const host = join(tail(split(new URL(serverUri).hostname, ".")), ".");
    if (host === remote) {
      // see for reference: https://code.visualstudio.com/api/references/vscode-api#Extension
      const ext = extensions.getExtension(
        extensionName ? extensionName : "SAPOSS.app-studio-toolkit"
      );
      if (ext) {
        switch (ext.extensionKind) {
          case ExtensionKind.Workspace:
            runPlatform = ExtensionRunMode.basWorkspace;
            break;
          case ExtensionKind.UI:
            runPlatform = ExtensionRunMode.basUi;
            break;
        }
      }
    } else {
      runPlatform = ExtensionRunMode.basRemote;
    }
  } else if (typeof env.remoteName === "string") {
    if (env.remoteName.toLowerCase().includes("wsl")) {
      runPlatform = ExtensionRunMode.wsl;
    }
  } else {
    runPlatform = ExtensionRunMode.desktop;
  }

  return runPlatform;
}

let keepAliveInterval: NodeJS.Timeout | undefined;

async function touchFile(filePath: string): Promise<void> {
  try {
    await workspace.fs.writeFile(Uri.file(filePath), new Uint8Array(0));
  } catch (error) {
    getLogger().error(`Error while touching file: ${error}`);
  }
}

function formatTimeRemaining(seconds: number): string {
  const minutes: number = Math.floor(seconds / 60);
  const remainingSeconds: number = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

async function askToSessionExtend(): Promise<boolean> {
  return window.withProgress(
    {
      location: ProgressLocation.Notification,
      title:
        "VS Code will close. To continue working remotely, please press 'Cancel'",
      cancellable: true,
    },
    async (progress, token: CancellationToken) => {
      const increment = 100 / EXTEND_SESSION_TIMEOUT;
      let secondsLeft = EXTEND_SESSION_TIMEOUT;

      return new Promise<boolean>((resolve) => {
        /* istanbul ignore next */
        const interval = setInterval(() => {
          secondsLeft--;
          progress.report({
            message: `time remaining: ${formatTimeRemaining(secondsLeft)}`,
            increment,
          });

          if (secondsLeft === 0) {
            clearInterval(interval);
            resolve(false); // Close window
          }
        }, 1000);

        token.onCancellationRequested(() => {
          clearInterval(interval);
          resolve(true); // Extend session
        });
      });
    }
  );
}

export function startBasKeepAlive(): void {
  // Only proceed if in hybrid mode
  if (getExtensionRunPlatform() !== ExtensionRunMode.basRemote) {
    return;
  }

  // Clear any existing interval first to prevent duplicates
  cleanKeepAliveInterval();

  async function executeKeepAlive(): Promise<void> {
    await touchFile(BAS_KEEP_ALIVE_FILE);
  }

  let shouldExtendPromise: Promise<boolean> | undefined;
  let sessionStartTime = Date.now();

  // Execute immediately once
  void executeKeepAlive();

  /* istanbul ignore next */
  // eslint-disable-next-line @typescript-eslint/no-misused-promises -- no need to handle promise rejection
  keepAliveInterval = setInterval(async () => {
    void executeKeepAlive();

    const timeSinceStart = Date.now() - sessionStartTime;
    if (timeSinceStart > MAX_SESSION_TIME - KEEP_ALIVE_TIMEOUT) {
      if (shouldExtendPromise === undefined) {
        // Only ask once
        shouldExtendPromise = askToSessionExtend();

        if (!(await shouldExtendPromise)) {
          // Stop keep alive interval before closing VS Code altrough it will be executed on extension deactivation
          // because 'closeWindow' not sure closing VS Code (e.g. there are unsaved changes)
          cleanKeepAliveInterval();
          void commands.executeCommand("workbench.action.closeWindow");
        } else {
          // Extend session for another MAX_SESSION_TIME cycle
          sessionStartTime = Date.now();
        }
        shouldExtendPromise = undefined;
      }
    }
  }, KEEP_ALIVE_TIMEOUT);
}

export function cleanKeepAliveInterval(): void {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = undefined;
  }
}

// fot testing
export const internal = {
  askToSessionExtend,
  formatTimeRemaining,
};
