// import { window, commands, QuickInputButtons, Disposable } from "vscode";
// import type { QuickPickItem, QuickInput, QuickInputButton } from "vscode";
import { LandscapeNode } from "../tree/treeItems";
import { autoRefresh, RefreshRate } from "../utils";
// import { getLogger } from "../../logger/logger";
import { devspace } from "@sap/bas-sdk";
import { PackName } from "./devspace";
// import { messages } from "../messages";
// import { isEmpty } from "lodash";
// import {
//   getDevSpaceOptionalExtensions,
//   getDevSpacePackExtensions,
//   getDevSpaceRequiredExtensions,
//   getDevSpacesSpec,
// } from "./spec_and_extensions";
// import { getJwt } from "../../authentication/auth-utils";

export async function cmdDevSpaceAdd(landscape: LandscapeNode): Promise<void> {
  // const devSpacePick: DevSpacePick = await multiStepInput(landscape);

  // const devSpaceCreation = {
  //   id: "",
  //   memoryLimitBytes: 2147483648,
  //   extensions: getDevSpaceRequiredExtensions(
  //     devSpacePick.devSpacesSpec.extensions
  //   )
  //     .concat(
  //       getDevSpacePackExtensions(
  //         devSpacePick.devSpacesSpec.packs,
  //         devSpacePick.packName
  //       )
  //     )
  //     .concat(getDevSpaceOptionalExtensions(devSpacePick.optionalExtensions)),
  //   workspacedisplayname: devSpacePick.name,
  //   annotations: {
  //     pack: devSpacePick.packName,
  //     packTagline: devSpacePick.tagline,
  //     optionalExtensions:
  //       '["' +
  //       getDevSpaceOptionalExtensions(devSpacePick.optionalExtensions).join(
  //         '","'
  //       ) +
  //       '"]',
  //     technicalExtensions:
  //       '["' +
  //       getDevSpaceRequiredExtensions(
  //         devSpacePick.devSpacesSpec.extensions
  //       ).join('","') +
  //       '"]',
  //   },
  // } as devspace.DevSpaceCreation;

  // await createDevSpace(devSpaceCreation, landscape.url);
  await new Promise((resolve, reject) => setTimeout(() => resolve(""), 100));
  autoRefresh(RefreshRate.SEC_10, RefreshRate.MIN_3);
}

// function filterExtensionsWorkaround(
//   devSpaceDetails: devspace.DevSpaceCreation
// ): string[] {
//   if (devSpaceDetails.annotations.pack == PackName.CAP) {
//     devSpaceDetails.extensions = devSpaceDetails.extensions.filter(
//       (extension) =>
//         ![
//           "hana-runtime-tools/ext-hrtt-appstudio-rel",
//           "sap-ux-all-extensions/ext-sap-ux",
//         ].includes(extension)
//     );
//   } else if (devSpaceDetails.annotations.pack == PackName.FIORI) {
//     devSpaceDetails.extensions = devSpaceDetails.extensions.filter(
//       (extension) =>
//         ![
//           "sap-ux-internal-extension/ext-sap-ux",
//           "sap-ux-requirements-gathering-extension/ext-sap-ux",
//           "launchpad-module/launchpad-module",
//           "sap-ux-all-extensions/ext-sap-ux",
//           "adaptation-project/ext-adaptation-project",
//         ].includes(extension)
//     );
//   } else if (devSpaceDetails.annotations.pack == PackName.HANA) {
//     devSpaceDetails.extensions = devSpaceDetails.extensions.filter(
//       (extension) =>
//         ![
//           "hana-tools/ext-hrtt-appstudio-rel",
//           "hana-runtime-tools/ext-hrtt-appstudio-rel",
//           "hana-calculation-view-editor-base/ext-hrtt-appstudio-rel",
//           "hana-calculation-view-editor/ext-hrtt-appstudio-rel",
//         ].includes(extension)
//     );
//   }
//   return devSpaceDetails.extensions;
// }

// export async function createDevSpace(
//   devSpaceDetails: devspace.DevSpaceCreation,
//   landscapeUrl: string
// ): Promise<void> {
//   try {
//     const jwt = await getJwt(landscapeUrl);
//     // TODO: Delete workaround
//     devSpaceDetails.extensions = filterExtensionsWorkaround(devSpaceDetails);
//     await devspace.createDevSpace(landscapeUrl, devSpaceDetails, jwt);
//     const message = messages.info_devspace_create(
//       devSpaceDetails.workspacedisplayname
//     );
//     getLogger().info(message);
//     void window.showInformationMessage(message);
//     void commands.executeCommand("local-extension.tree.refresh");
//   } catch (e) {
//     const message = messages.err_devspace_create(
//       devSpaceDetails.workspacedisplayname,
//       e.toString()
//     );
//     getLogger().error(message);
//     void window.showErrorMessage(message);
//   }
// }

// export interface DevSpacePick {
//   packName: PackName;
//   name: string;
//   tagline: string;
//   optionalExtensions: devspace.DevSpaceExtension[];
//   devSpacesSpec: devspace.DevSpaceSpec;
// }

// export async function multiStepInput(
//   landscape: LandscapeNode
// ): Promise<DevSpacePick> {
//   interface State {
//     title: string;
//     step: number;
//     totalSteps: number;
//     type: QuickPickItem | string;
//     pack: string;
//     name: string;
//     tagline: string;
//     optionalExtensionQuickpick: QuickPickItem[];
//     optionalExtensions: devspace.DevSpaceExtension[];
//   }

//   async function collectInputs() {
//     const state = {} as Partial<State>;
//     await MultiStepInput.run((input) => pickDevSpaceType(input, state));
//     return state as State;
//   }

//   const title = "Create New Dev Space";

//   async function pickDevSpaceType(
//     input: MultiStepInput,
//     state: Partial<State>
//   ) {
//     state.type = await input.showQuickPick({
//       title,
//       step: 1,
//       totalSteps: 3,
//       placeholder: "Pick Dev Space Type",
//       items: getDevSpacesTypes(),
//       activeItem: typeof state.type !== "string" ? state.type : undefined,
//       shouldResume: shouldResume,
//     });
//     state.pack = state.type.label;
//     state.tagline = getDevSpacePackTagline(state.pack);
//     return (input: MultiStepInput) => inputDevSpaceName(input, state);
//   }

//   async function inputDevSpaceName(
//     input: MultiStepInput,
//     state: Partial<State>
//   ) {
//     state.name = await input.showInputBox({
//       title,
//       step: 2,
//       totalSteps: 3,
//       value: typeof state.name === "string" ? state.name : "",
//       prompt: "Choose a unique name for the dev space",
//       validate: validateNameIsUnique,
//       shouldResume: shouldResume,
//     });
//     return (input: MultiStepInput) =>
//       pickDevSpaceoptionalExtensions(input, state);
//   }

//   async function pickDevSpaceoptionalExtensions(
//     input: MultiStepInput,
//     state: Partial<State>
//   ) {
//     state.optionalExtensionQuickpick = await input.showMultiQuickPick({
//       title,
//       step: 3,
//       totalSteps: 3,
//       placeholder: "Pick Optional Extensions",
//       items: getDevSpaceOptionalExtensions(),
//       activeItem:
//         typeof state.type !== "string"
//           ? state.optionalExtensionQuickpick
//           : undefined,
//       canSelectMany: true,
//       shouldResume: shouldResume,
//     });
//     const optionalExtensionNames = state.optionalExtensionQuickpick.map(
//       (optionalExtension) => {
//         return optionalExtension.label;
//       }
//     );
//     state.optionalExtensions = getDevSpaceOptionalExtensionsPick(
//       optionalExtensionNames
//     );
//   }

//   function shouldResume() {
//     // Could show a notification with the option to resume.
//     // eslint-disable-next-line @typescript-eslint/no-unused-vars -- suppress warn
//     return new Promise<boolean>((resolve, reject) => {
//       // noop
//     });
//   }
//   const devSpacesSpec = await getDevSpacesSpec(landscape.url);
//   const state = await collectInputs();

//   function getDevSpacesTypes(): QuickPickItem[] {
//     const spaces = devSpacesSpec?.packs.map((devSpacePack) => ({
//       label: devSpacePack.name,
//       detail: devSpacePack.description,
//     }));
//     // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- suppress warning
//     return spaces ?? [];
//   }

//   function getDevSpacePackTagline(name: string): string {
//     // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- suppress warning
//     return (
//       devSpacesSpec?.packs.filter((pack) => pack.name == name)[0].tagline ?? ""
//     );
//   }

//   function getDevSpaceOptionalExtensionsPick(
//     names: string[]
//   ): devspace.DevSpaceExtension[] {
//     const spaces = devSpacesSpec?.extensions.filter(
//       (extension) =>
//         extension.mode == "optional" && names.includes(extension.name)
//     );
//     // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- suppress warning
//     return spaces ?? [];
//   }

//   function getDevSpaceOptionalExtensions(): QuickPickItem[] {
//     const spaces = devSpacesSpec?.extensions
//       .filter((extension) => extension.mode == "optional")
//       .map((extension) => ({
//         label: extension.name,
//         detail: extension.description,
//       }));
//     // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- suppress warning
//     return spaces ?? [];
//   }

//   function validateNameIsUnique(name: string): Promise<string | undefined> {
//     const regexp = new RegExp("^[a-zA-Z0-9][a-zA-Z0-9_]*$");
//     return Promise.resolve(
//       !regexp.test(name) ? messages.err_name_validation : undefined
//     );
//   }

//   return {
//     packName: state.pack,
//     name: state.name,
//     tagline: state.tagline,
//     optionalExtensions: state.optionalExtensions,
//     devSpacesSpec: devSpacesSpec,
//   } as DevSpacePick;
// }

// // -------------------------------------------------------
// // Helper code that wraps the API for the multi-step case.
// // -------------------------------------------------------

// class InputFlowAction {
//   static back = new InputFlowAction();
//   static cancel = new InputFlowAction();
//   static resume = new InputFlowAction();
// }

// type InputStep = (input: MultiStepInput) => Thenable<InputStep | void>;

// interface QuickPickParameters<T extends QuickPickItem> {
//   title: string;
//   step: number;
//   totalSteps: number;
//   items: T[];
//   activeItem?: T;
//   placeholder: string;
//   buttons?: QuickInputButton[];
//   shouldResume: () => Thenable<boolean>;
// }

// interface MultiQuickPickParameters<T extends QuickPickItem> {
//   title: string;
//   step: number;
//   totalSteps: number;
//   items: T[];
//   activeItems?: T[];
//   placeholder: string;
//   buttons?: QuickInputButton[];
//   shouldResume: () => Thenable<boolean>;
// }

// interface InputBoxParameters {
//   title: string;
//   step: number;
//   totalSteps: number;
//   value: string;
//   prompt: string;
//   validate: (value: string) => Promise<string | undefined>;
//   buttons?: QuickInputButton[];
//   shouldResume: () => Thenable<boolean>;
// }

// class MultiStepInput {
//   // eslint-disable-next-line @typescript-eslint/no-unused-vars -- suppress warn
//   static async run<T>(start: InputStep) {
//     const input = new MultiStepInput();
//     return input.stepThrough(start);
//   }

//   private current?: QuickInput;
//   private readonly steps: InputStep[] = [];

//   // eslint-disable-next-line @typescript-eslint/no-unused-vars -- suppress warn
//   private async stepThrough<T>(start: InputStep) {
//     let step: InputStep | void = start;
//     while (step) {
//       this.steps.push(step);
//       if (this.current) {
//         this.current.enabled = false;
//         this.current.busy = true;
//       }
//       try {
//         step = await step(this);
//       } catch (err) {
//         if (err === InputFlowAction.back) {
//           this.steps.pop();
//           step = this.steps.pop();
//         } else if (err === InputFlowAction.resume) {
//           step = this.steps.pop();
//         } else if (err === InputFlowAction.cancel) {
//           step = undefined;
//         } else {
//           throw err;
//         }
//       }
//     }
//     if (this.current) {
//       this.current.dispose();
//     }
//   }

//   async showQuickPick<
//     T extends QuickPickItem,
//     P extends QuickPickParameters<T>
//   >({
//     title,
//     step,
//     totalSteps,
//     items,
//     activeItem,
//     placeholder,
//     buttons,
//     shouldResume,
//   }: P) {
//     const disposables: Disposable[] = [];
//     try {
//       return await new Promise<
//         T | (P extends { buttons: (infer I)[] } ? I : never)
//       >((resolve, reject) => {
//         const input = window.createQuickPick<T>();
//         input.title = title;
//         input.step = step;
//         input.totalSteps = totalSteps;
//         input.placeholder = placeholder;
//         input.items = items;
//         if (activeItem) {
//           input.activeItems = [activeItem];
//         }
//         input.buttons = [
//           ...(this.steps.length > 1 ? [QuickInputButtons.Back] : []),
//           ...(buttons || []),
//         ];
//         disposables.push(
//           input.onDidTriggerButton((item) => {
//             if (item === QuickInputButtons.Back) {
//               reject(InputFlowAction.back);
//             } else {
//               // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- suppress warn
//               resolve(<any>item);
//             }
//           }),
//           input.onDidChangeSelection((items) => resolve(items[0])),
//           input.onDidHide(() => {
//             (async () => {
//               reject(
//                 shouldResume && (await shouldResume())
//                   ? InputFlowAction.resume
//                   : InputFlowAction.cancel
//               );
//             })().catch(reject);
//           })
//         );
//         if (this.current) {
//           this.current.dispose();
//         }
//         this.current = input;
//         this.current.show();
//       });
//     } finally {
//       // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- suppress warn
//       disposables.forEach((d) => d.dispose());
//     }
//   }

//   async showMultiQuickPick<
//     T extends QuickPickItem,
//     P extends MultiQuickPickParameters<T>
//   >({
//     title,
//     step,
//     totalSteps,
//     items,
//     activeItems,
//     placeholder,
//     buttons,
//     shouldResume,
//   }: P) {
//     const disposables: Disposable[] = [];
//     try {
//       return await new Promise<
//         T[] | (P extends { buttons: (infer I)[] } ? I : never)
//       >((resolve, reject) => {
//         const input = window.createQuickPick<T>();
//         input.title = title;
//         input.step = step;
//         input.totalSteps = totalSteps;
//         input.placeholder = placeholder;
//         input.items = items;
//         input.canSelectMany = true;
//         if (!isEmpty(activeItems)) {
//           input.activeItems = activeItems!;
//         }
//         input.buttons = [
//           ...(this.steps.length > 1 ? [QuickInputButtons.Back] : []),
//           ...(buttons || []),
//         ];
//         let selectedItems: readonly T[] = [];
//         disposables.push(
//           input.onDidTriggerButton((item) => {
//             if (item === QuickInputButtons.Back) {
//               reject(InputFlowAction.back);
//             } else {
//               // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- suppress warn
//               resolve(<any>item);
//             }
//           }),
//           input.onDidChangeSelection((selected) => {
//             selectedItems = selected;
//           }),
//           input.onDidAccept(() => {
//             // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- suppress warn
//             resolve(<any>selectedItems);
//           }),
//           input.onDidHide(() => {
//             (async () => {
//               reject(
//                 shouldResume && (await shouldResume())
//                   ? InputFlowAction.resume
//                   : InputFlowAction.cancel
//               );
//             })().catch(reject);
//           })
//         );
//         if (this.current) {
//           this.current.dispose();
//         }
//         this.current = input;
//         this.current.show();
//       });
//     } finally {
//       // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- suppress warn
//       disposables.forEach((d) => d.dispose());
//     }
//   }

//   async showInputBox<P extends InputBoxParameters>({
//     title,
//     step,
//     totalSteps,
//     value,
//     prompt,
//     validate,
//     buttons,
//     shouldResume,
//   }: P) {
//     const disposables: Disposable[] = [];
//     try {
//       return await new Promise<
//         string | (P extends { buttons: (infer I)[] } ? I : never)
//       >((resolve, reject) => {
//         const input = window.createInputBox();
//         input.title = title;
//         input.step = step;
//         input.totalSteps = totalSteps;
//         input.value = value || "";
//         input.prompt = prompt;
//         input.buttons = [
//           ...(this.steps.length > 1 ? [QuickInputButtons.Back] : []),
//           ...(buttons || []),
//         ];
//         let validating = validate("");
//         disposables.push(
//           input.onDidTriggerButton((item) => {
//             if (item === QuickInputButtons.Back) {
//               reject(InputFlowAction.back);
//             } else {
//               // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- suppress warn
//               resolve(<any>item);
//             }
//           }),
//           input.onDidAccept(async () => {
//             const value = input.value;
//             input.enabled = false;
//             input.busy = true;
//             if (!(await validate(value))) {
//               resolve(value);
//             }
//             input.enabled = true;
//             input.busy = false;
//           }),
//           input.onDidChangeValue(async (text) => {
//             const current = validate(text);
//             validating = current;
//             const validationMessage = await current;
//             if (current === validating) {
//               input.validationMessage = validationMessage;
//             }
//           }),
//           input.onDidHide(() => {
//             (async () => {
//               reject(
//                 shouldResume && (await shouldResume())
//                   ? InputFlowAction.resume
//                   : InputFlowAction.cancel
//               );
//             })().catch(reject);
//           })
//         );
//         if (this.current) {
//           this.current.dispose();
//         }
//         this.current = input;
//         this.current.show();
//       });
//     } finally {
//       // eslint-disable-next-line @typescript-eslint/no-unsafe-return -- suppress warn
//       disposables.forEach((d) => d.dispose());
//     }
//   }
// }
