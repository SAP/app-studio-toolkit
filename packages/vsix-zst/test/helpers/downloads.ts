import { createWriteStream } from "fs";
import { get } from "https";
import { basename, join } from "path";
import { URL } from "url";

export const THEMES_VSIX =
  "https://github.com/SAP/app-studio-toolkit/releases/download/app-studio-toolkit-themes%406.0.1/app-studio-toolkit-themes-6.0.1.vsix";
export const UPGRADE_TOOL_VSIX =
  "https://github.com/SAP/app-studio-toolkit/releases/download/vscode-deps-upgrade-tool%405.0.0/vscode-deps-upgrade-tool-5.0.0.vsix";

export async function downloadVsix(
  url: string,
  folder: string
): Promise<string> {
  const target = join(folder, basename(new URL(url).pathname));
  await downloadTo(url, target);
  return target;
}

function downloadTo(url: string, target: string): Promise<void> {
  return new Promise((resolve, reject) => {
    get(url, (response) => {
      if (
        response.statusCode !== undefined &&
        response.statusCode >= 300 &&
        response.statusCode < 400 &&
        response.headers.location !== undefined
      ) {
        void downloadTo(response.headers.location, target).then(
          resolve,
          reject
        );
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }

      const file = createWriteStream(target);
      file.once("error", reject);
      file.once("finish", resolve);
      response.pipe(file);
    }).once("error", reject);
  });
}
