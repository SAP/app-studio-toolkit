import { window } from "vscode";
import { getLogger } from "../../logger/logger";
import { messages } from "../common/messages";
import * as sdk from "@sap/bas-sdk";
import { getJwt } from "../../authentication/auth-utils";
import { $enum } from "ts-enum-util";

export interface DevSpaceInfo
  extends Omit<sdk.devspace.DevspaceInfo, "status"> {
  status: sdk.devspace.DevSpaceStatus;
}

function patchPack(pack: string): string {
  // known mishmash : `SAP HANA Public` vs. `SAP Hana`
  return pack.toLowerCase().startsWith(sdk.devspace.PackName.HANA.toLowerCase())
    ? sdk.devspace.PackName.HANA
    : pack;
}

export async function getDevSpaces(
  landscapeUrl: string
): Promise<DevSpaceInfo[] | void> {
  return getJwt(landscapeUrl)
    .then((jwt) => {
      return sdk.devspace
        .getDevSpaces(landscapeUrl, jwt)
        .then((devspaces: sdk.devspace.DevspaceInfo[]) => {
          return devspaces.reduce((acc, ds) => {
            acc.push({
              devspaceDisplayName: ds.devspaceDisplayName,
              devspaceOrigin: ds.devspaceOrigin,
              pack: patchPack(ds.pack),
              packDisplayName: ds.packDisplayName,
              url: ds.url,
              id: ds.id,
              optionalExtensions: ds.optionalExtensions,
              technicalExtensions: ds.technicalExtensions,
              status: $enum(sdk.devspace.DevSpaceStatus).asKeyOrDefault(
                ds.status,
                "ERROR"
              ) as sdk.devspace.DevSpaceStatus,
            });
            return acc;
          }, [] as DevSpaceInfo[]);
        }) as unknown as DevSpaceInfo[];
    })
    .catch((e) => {
      const message = messages.err_get_devspace(e.toString());
      getLogger().error(message);
      void window.showErrorMessage(message);
    });
}
