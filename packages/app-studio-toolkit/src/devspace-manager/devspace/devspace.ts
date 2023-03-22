import { window } from "vscode";
import { getLogger } from "../../logger/logger";
import { messages } from "../messages";
import { devspace } from "@sap/bas-sdk";
import { getJwt } from "../../authentication/auth-utils";
import { $enum } from "ts-enum-util";
// import { waccess, wOP } from "../utils";

export enum DevSpaceStatus {
  RUNNING = "RUNNING",
  STARTING = "STARTING",
  STOPPED = "STOPPED",
  STOPPING = "STOPPING",
  ERROR = "ERROR",
  SAFE_MODE = "SAFE_MODE",
}

export enum PackName {
  FIORI = "SAP Fiori",
  CAP = "SAP Cloud Business Application",
  HANA = "SAP Hana",
  SME = "SAP SME Business Application",
  MOBILE = "SAP Mobile Services",
  BASIC = "Basic",
  LCAP = "LCAP",
}

export interface DevSpaceInfo extends Omit<devspace.DevspaceInfo, "status"> {
  status: DevSpaceStatus;
}
export async function getDevSpaces(
  landscapeUrl: string
): Promise<DevSpaceInfo[]> {
  return getJwt(landscapeUrl)
    .then((jwt) => {
      return devspace
        .getDevSpaces(landscapeUrl, jwt)
        .then((devspaces: devspace.DevspaceInfo[]) => {
          return devspaces.reduce((acc, ds) => {
            acc.push({
              devspaceDisplayName: ds.devspaceDisplayName,
              devspaceOrigin: ds.devspaceOrigin,
              pack: ds.pack,
              packDisplayName: ds.packDisplayName,
              url: ds.url,
              id: ds.id,
              sshEnabled: ds.sshEnabled,
              optionalExtensions: ds.optionalExtensions,
              technicalExtensions: ds.technicalExtensions,
              status: $enum(DevSpaceStatus).asKeyOrDefault(
                ds.status,
                "ERROR"
              ) as DevSpaceStatus,
            });
            return acc;
          }, [] as DevSpaceInfo[]);
        }) as unknown as DevSpaceInfo[];
    })
    .catch((e) => {
      const message = messages.err_get_devspace(e.toString());
      getLogger().error(message);
      void window.showErrorMessage(message);
      return [];
    });
}
