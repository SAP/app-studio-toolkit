import { window, commands } from "vscode";
import type { QuickPickItem } from "vscode";
import { DevSpaceNode } from "../tree/treeItems";
import { getLogger } from "../../logger/logger";
import {
  getDevSpaceOptionalExtensions,
  getDevSpacePackExtensions,
  getDevSpaceRequiredExtensions,
  getDevSpacesSpec,
} from "./spec_and_extensions";
import { DevSpaceInfo, getDevSpaces, PackName } from "./devspace";
// import { waccess, wOP } from "../utils";
import { messages } from "../messages";
import { devspace } from "@sap/bas-sdk";
import { $enum } from "ts-enum-util";
import { getJwt } from "../../auth/authentication";

// interface DevSpaceEdit {
//   extensions: string[];
//   annotations: {
//     optionalExtensions: string;
//     technicalExtensions: string;
//   };
//   workspacedisplayname: string;
// }

export async function cmdDevSpaceEdit(devSpace: DevSpaceNode): Promise<void> {
  const devSpacesSpec = await getDevSpacesSpec(devSpace.landscapeUrl);
  if (!devSpacesSpec) {
    return;
  }
  const devSpacesInfo: DevSpaceInfo = (
    await getDevSpaces(devSpace.landscapeUrl)
  ).filter((ds) => ds.id == devSpace.id)[0];
  const devSpaceOptionalExtensions = await pickDevSpaceOptionalExtensions(
    devSpacesSpec,
    devSpacesInfo
  );
  if (devSpaceOptionalExtensions) {
    // else canceled by user
    const devSpaceEdit = {
      extensions: getDevSpaceRequiredExtensions(devSpacesSpec.extensions)
        .concat(
          getDevSpacePackExtensions(devSpacesSpec.packs, devSpacesInfo.pack) ??
            []
        )
        .concat(getDevSpaceOptionalExtensions(devSpaceOptionalExtensions)),
      workspacedisplayname: devSpacesInfo.devspaceDisplayName,
      annotations: {
        optionalExtensions:
          '["' +
          getDevSpaceOptionalExtensions(devSpaceOptionalExtensions).join(
            '","'
          ) +
          '"]',
        technicalExtensions:
          '["' +
          getDevSpaceRequiredExtensions(devSpacesSpec.extensions).join('","') +
          '"]',
      },
    };
    await editDevSpace(devSpaceEdit, devSpacesInfo, devSpace.landscapeUrl);
  }
}

function filterExtensionsWorkaround(
  devSpaceDetails: devspace.DevSpaceEdit,
  packName: PackName
): string[] {
  if (packName == PackName.CAP) {
    devSpaceDetails.extensions = devSpaceDetails.extensions.filter(
      (extension) =>
        ![
          "hana-runtime-tools/ext-hrtt-appstudio-rel",
          "sap-ux-all-extensions/ext-sap-ux",
        ].includes(extension)
    );
  } else if (packName == PackName.FIORI) {
    devSpaceDetails.extensions = devSpaceDetails.extensions.filter(
      (extension) =>
        ![
          "sap-ux-internal-extension/ext-sap-ux",
          "sap-ux-requirements-gathering-extension/ext-sap-ux",
          "launchpad-module/launchpad-module",
          "sap-ux-all-extensions/ext-sap-ux",
          "adaptation-project/ext-adaptation-project",
        ].includes(extension)
    );
  } else if (packName == PackName.HANA) {
    devSpaceDetails.extensions = devSpaceDetails.extensions.filter(
      (extension) =>
        ![
          "hana-tools/ext-hrtt-appstudio-rel",
          "hana-runtime-tools/ext-hrtt-appstudio-rel",
          "hana-calculation-view-editor-base/ext-hrtt-appstudio-rel",
          "hana-calculation-view-editor/ext-hrtt-appstudio-rel",
        ].includes(extension)
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- ignore eslint warning
  return devSpaceDetails.extensions;
}

async function editDevSpace(
  devSpaceDetails: devspace.DevSpaceEdit,
  devSpacesInfo: DevSpaceInfo,
  landscapeUrl: string
): Promise<void> {
  try {
    const jwt = await getJwt(landscapeUrl);
    if (!jwt) {
      throw new Error(`authorization token can't be obtained`);
    }
    // TODO: Delete workaround
    devSpaceDetails.extensions = filterExtensionsWorkaround(
      devSpaceDetails,
      $enum(PackName).getKeyOrThrow(devSpacesInfo.pack) as PackName
    );
    await devspace.updateDevSpace(
      landscapeUrl,
      devSpacesInfo.id,
      devSpaceDetails,
      jwt
    );
    const message = messages.info_devspace_edited(
      devSpaceDetails.workspacedisplayname,
      devSpacesInfo.id
    );
    getLogger().info(message);
    void window.showInformationMessage(message);
    void commands.executeCommand("local-extension.tree.refresh");
  } catch (e) {
    const message = `Failed Editing '${devSpaceDetails.workspacedisplayname}', ${e.message}`;
    getLogger().error(message);
    void window.showErrorMessage(message);
  }
}

async function pickDevSpaceOptionalExtensions(
  devSpacesSpec: devspace.DevSpaceSpec,
  devSpacesInfo: DevSpaceInfo
): Promise<devspace.DevSpaceExtension[] | undefined> {
  const optionalExtensions = getDevSpaceOptionalExtensionsFromInfo(
    devSpacesInfo,
    devSpacesSpec
  );
  const optionalExtensionQuickpick = await window.showQuickPick<QuickPickItem>(
    optionalExtensions,
    {
      canPickMany: true,
    }
  );
  if (optionalExtensionQuickpick) {
    const optionalExtensionNames = optionalExtensionQuickpick.map(
      (optionalExtension) => optionalExtension.label
    );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- suppress eslint warning
    return getDevSpaceOptionalExtensionsPick(
      optionalExtensionNames,
      devSpacesSpec
    );
  }
}

function getDevSpaceOptionalExtensionsPick(
  names: string[],
  devSpacesSpec: devspace.DevSpaceSpec
): devspace.DevSpaceExtension[] {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- suppress eslint warning
  return devSpacesSpec.extensions.filter(
    (extension) =>
      extension.mode == "optional" && names.includes(extension.name)
  );
}

function getDevSpaceOptionalExtensionsFromInfo(
  devSpacesInfo: DevSpaceInfo,
  devSpacesSpec: devspace.DevSpaceSpec
): QuickPickItem[] {
  const optionalExtensionsInDevSpace = devSpacesInfo.optionalExtensions
    .replace("[", "")
    .replace("]", "")
    .replace('"', "")
    .replace('","', ",")
    .replace('"', "")
    .split(",");
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- suppress eslint warning
  return devSpacesSpec.extensions
    .filter((extension) => extension.mode == "optional")
    .map((extension) => ({
      label: extension.name,
      detail: extension.description,
      picked: optionalExtensionsInDevSpace.includes(
        `${extension.namespace}/${extension.name}`
      ),
    }))
    .sort(function (a, b) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- suppress eslint warning
      return a.label.localeCompare(b.label);
    });
}
