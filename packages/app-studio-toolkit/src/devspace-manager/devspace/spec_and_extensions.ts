// import { window, workspace } from "vscode";
// import { devspace } from "@sap/bas-sdk";
// import { getJwt } from "../../authentication/auth-utils";
// import { getLogger } from "../../logger/logger";
// import { messages } from "../messages";
// import { throws } from "assert";

// export function getDevSpacePack(
//   packs: devspace.DevSpacePack[],
//   name: string
// ): devspace.DevSpacePack | undefined {
//   // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- ignore eslint warning
//   return packs.filter((devSpacePack) => devSpacePack.name == name)[0];
// }

// export function getDevSpacePackExtensions(
//   packs: devspace.DevSpacePack[],
//   name: string
// ): string[] {
//   // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- ignore eslint warning
//   return (
//     getDevSpacePack(packs, name)?.extensions.map(
//       (extension) => `${extension.namespace}/${extension.name}`
//     ) || []
//   );
// }

// export function getDevSpaceRequiredExtensions(
//   extensions: devspace.DevSpaceExtension[]
// ): string[] {
//   return extensions
//     .filter((extension) => extension.mode == "required")
//     .map((extension) => `${extension.namespace}/${extension.name}`);
// }

// // TODO: remove the filter of remotessh when ws extension is productive
// export function getDevSpaceOptionalExtensions(
//   extensions: devspace.DevSpaceExtension[]
// ): string[] {
//   const remoteSShVersion = workspace
//     .getConfiguration()
//     .get<string>("sap-remote.backend-version");
//   return extensions
//     .filter((extension) => extension.mode == "optional")
//     .filter((extension) => !extension.name.startsWith("remotessh"))
//     .map((extension) => `${extension.namespace}/${extension.name}`)
//     .concat([`workspace-extensions/${remoteSShVersion}`]);
// }

// export function getDevSpacesSpec(
//   landscapeUrl: string
// ): Promise<devspace.DevSpaceSpec | void> {
//   return getJwt(landscapeUrl)
//     .then((jwt) => {
//       return devspace
//         .getDevSpacesSpec(landscapeUrl, jwt)
//         .then((spec: devspace.DevSpaceSpec | undefined) => {
//           getLogger().info(`Successfully got Dev Space Spec`);
//           return spec;
//         });
//     })
//     .catch((e) => {
//       const message = messages.err_get_devspace(e.toString());
//       getLogger().error(message);
//       void window.showErrorMessage(message);
//     });
// }

// export function getExtensionPacks(
//   landscapeUrl: string
// ): Promise<devspace.ExtensionPackInfo[]> {
//   return getJwt(landscapeUrl)
//     .then((jwt) => {
//       return devspace.getExtensionPacks(landscapeUrl, jwt);
//     })
//     .catch((error: Error) => {
//       const message = messages.err_get_extpack(error.toString());
//       getLogger().error(message);
//       void window.showErrorMessage(message);
//       return [];
//     });
// }
