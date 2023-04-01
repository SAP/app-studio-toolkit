import { ConfigurationTarget, workspace } from "vscode";
import { compact, trim, uniq } from "lodash";
import { hasJwt } from "../../authentication/auth-utils";
import { URL } from "node:url";

export interface LandscapeInfo {
  name: string;
  url: string;
  isLoggedIn: boolean;
}

function isLandscapeLoggedIn(url: string): Promise<boolean> {
  return hasJwt(url);
}

export async function getLandscapes(): Promise<LandscapeInfo[]> {
  const config: string | undefined = await workspace
    .getConfiguration()
    .get("sap-remote.landscape-name");
  const landscapes = uniq(
    compact((config ?? "").split(",").map((value) => trim(value)))
  );

  const lands: LandscapeInfo[] = [];
  for (const landscape of landscapes) {
    const url = new URL(landscape);
    lands.push({
      name: url.hostname,
      url: url.toString(),
      isLoggedIn: await isLandscapeLoggedIn(landscape),
    });
  }
  return lands;
}

export async function removeLandscape(landscapeName: string): Promise<void> {
  const url = new URL(landscapeName);
  const config: string | undefined = workspace
    .getConfiguration()
    .get<string>("sap-remote.landscape-name");
  if (config) {
    const updated = config
      .split(",")
      .filter((landscape) => new URL(landscape).toString() != url.toString())
      .join(",");
    return workspace
      .getConfiguration()
      .update("sap-remote.landscape-name", updated, ConfigurationTarget.Global);
  }
}

export async function getConnectedLandscapes(): Promise<LandscapeInfo[]> {
  return getLandscapes().then((landscapes) => {
    return landscapes.filter((landscape) => landscape.isLoggedIn);
  });
}
