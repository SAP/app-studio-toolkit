import {
  ExtensionContext,
  window,
  StatusBarItem,
  EventEmitter,
  workspace,
  commands,
  StatusBarAlignment,
  extensions,
  ConfigurationChangeEvent,
} from "vscode";
import * as _ from "lodash";
import { CFTargetNotCurrent, CFTargetTI, CFView } from "./cfView";
import { messages } from "./messages";
import {
  cmdLogin,
  cmdCreateService,
  cmdCFSetOrgSpace,
  cmdSelectSpace,
  cmdCreateUps,
  cmdSelectAndSaveTarget,
} from "./commands";
import {
  cmdDeployServiceAPI,
  cmdSetCurrentTarget,
  cmdDeleteTarget,
  cmdBindLocal,
  cmdReloadTargets,
  cmdGetSpaceServices,
  cmdGetUpsServiceInstances,
  cmdGetServiceInstances,
  execSetTarget,
  execSaveTarget,
} from "./cfViewCommands";

import { cfGetConfigFilePath, cfGetConfigFileField, ITarget, cfGetTarget, OK } from "@sap/cf-tools";
import * as fs from "fs";
import { DependencyHandler } from "./run-configuration";
import { IRunConfigRegistry } from "@sap/wing-run-config-types";
import { toText } from "./utils";
import { getModuleLogger, initLogger } from "./logger/logger-wrapper";

const LOGGER_MODULE = "extension";
let cfStatusBarItem: StatusBarItem;
const runConfigExtName = "sap.vscode-wing-run-config";
let treeDataProvider: CFView;
let extPath: string;

const targetChangedEventEmitter = new EventEmitter<ITarget | undefined>();
const onDidChangeTarget = targetChangedEventEmitter.event;

async function updateStatusBar(): Promise<boolean | undefined> {
  let isUpdated;
  const beforeText = _.get(cfStatusBarItem, "text");
  const results = await Promise.all([cfGetConfigFileField("OrganizationFields"), cfGetConfigFileField("SpaceFields")]);
  const orgField: string = _.get(results, "[0].Name");
  const spaceField: string = _.get(results, "[1].Name");
  const isNoTarget = _.isEmpty(orgField) && _.isEmpty(spaceField);
  const updatedText = `${isNoTarget ? messages.not_targeted : messages.targeting(orgField, spaceField)}`;

  if (beforeText !== updatedText) {
    _.set(cfStatusBarItem, "text", updatedText);
    if (beforeText) {
      // eliminate firing event on initialization
      const target = async () => {
        try {
          return await cfGetTarget();
        } catch (e) {
          return;
        }
      };
      targetChangedEventEmitter.fire(isNoTarget ? undefined : await target());
      isUpdated = true;
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return isUpdated;
}

export function onCFConfigFileChange(): void {
  void updateStatusBar().then((isUpdated) => {
    if (isUpdated) {
      getModuleLogger(LOGGER_MODULE).debug(
        "onCFConfigFileChange: the Cloud Foundry 'config' file has changed. The status bar will be updated"
      );
      treeDataProvider.refresh();
    }
  });
}

function displayTargetWhenAllowed(): void {
  if (workspace.getConfiguration().get("CloudFoundryTools.showTargetInformation")) {
    cfStatusBarItem.show();
  } else {
    cfStatusBarItem.hide();
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function callbackOnDidChangeConfiguration(e: ConfigurationChangeEvent, context: ExtensionContext): void {
  if (e.affectsConfiguration("CloudFoundryTools.showTargetInformation")) {
    displayTargetWhenAllowed();
  }
}

async function init(context: ExtensionContext, cfConfigFilePath: string): Promise<void> {
  cfStatusBarItem = window.createStatusBarItem(StatusBarAlignment.Left, 100);
  context.subscriptions.push(cfStatusBarItem);

  // !!!! does not work on theia 1.5.0
  // cfStatusBarItem.command = {command: loginCmdId, arguments: [true], title: ""};
  // start workarround  --> remove following workarround in future theia releases
  /* eslint-disable-next-line @typescript-eslint/no-unsafe-argument */
  context.subscriptions.push(commands.registerCommand("cf.login.weak", cmdLogin.bind(null, true)));
  cfStatusBarItem.command = "cf.login";
  // end workarround

  void updateStatusBar();

  if (!_.isEmpty(cfConfigFilePath)) {
    fs.watchFile(cfConfigFilePath, onCFConfigFileChange);
  }

  displayTargetWhenAllowed();

  let platformExtension = extensions.getExtension<IRunConfigRegistry>(runConfigExtName);
  if (platformExtension) {
    if (!platformExtension.isActive) {
      try {
        await platformExtension.activate();
      } catch (e) {
        platformExtension = undefined;
        getModuleLogger(LOGGER_MODULE).error("activate <%s> extension fails", runConfigExtName, {
          exception: toText(new Error(e?.message as string)),
        });
      }
    }
    if (platformExtension) {
      const genericDependencyHandler = new DependencyHandler("cf-tools-rsource-dependency");
      platformExtension.exports.registerDependency(genericDependencyHandler);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      context.subscriptions.push(commands.registerCommand("cf.services.bind", genericDependencyHandler.bind));
      // eslint-disable-next-line @typescript-eslint/unbound-method
      context.subscriptions.push(commands.registerCommand("cf.services.unbind", genericDependencyHandler.unbind));
      // eslint-disable-next-line @typescript-eslint/unbound-method
      context.subscriptions.push(
        commands.registerCommand("cf.services.binding.state", genericDependencyHandler.getBindState)
      );
    }
  } else {
    getModuleLogger(LOGGER_MODULE).error("activate: the <%s> extension has not been set", runConfigExtName);
  }
}

export async function activate(context: ExtensionContext): Promise<unknown> {
  await initLogger(context);
  extPath = context.extensionPath;

  const cfConfigFilePath: string = cfGetConfigFilePath();
  treeDataProvider = new CFView(context, cfConfigFilePath);
  const view = window.createTreeView("cfView", { treeDataProvider, showCollapseAll: true });

  context.subscriptions.push(
    commands.registerCommand("cf.login", (weak: boolean, target: boolean, extEndPoint: string | undefined) => {
      return cmdLogin(weak, target, extEndPoint, { isSplit: !!weak }).then((result) => {
        if (OK === result) {
          const active = _.find(treeDataProvider.getTargets(), "target.isCurrent");
          if (active) {
            // after re-login the target data become invalid -> perform re-create target
            void cmdDeleteTarget(active, { "skip-reload": true, silent: true }).then(() => {
              void execSaveTarget(active, { "skip-reload": true, silent: true }).then(() => {
                void execSetTarget(active, { silent: true });
              });
            });
          }
        }
        return result;
      });
    })
  );

  context.subscriptions.push(workspace.onDidChangeConfiguration((e) => callbackOnDidChangeConfiguration(e, context)));

  function revealTargetItem(label?: string) {
    setTimeout(() => {
      const treeItem = _.find(treeDataProvider.getTargets(), label ? ["label", label] : "target.isCurrent");
      if (treeItem) {
        void view.reveal(treeItem, { select: true, focus: true, expand: true });
      }
    }, 400);
  }

  context.subscriptions.push(
    commands.registerCommand("cf.target.set", async (item: CFTargetTI | CFTargetNotCurrent) => {
      await cmdSetCurrentTarget(item);
      revealTargetItem();
    })
  );
  context.subscriptions.push(commands.registerCommand("cf.services.create", cmdCreateService));
  context.subscriptions.push(commands.registerCommand("cf.ups.create", cmdCreateUps));
  context.subscriptions.push(commands.registerCommand("cf.services.bind.local", cmdBindLocal));
  context.subscriptions.push(commands.registerCommand("cf.set.orgspace", cmdCFSetOrgSpace));
  context.subscriptions.push(
    commands.registerCommand("cf.targets.create", async () => {
      const label = await cmdSelectAndSaveTarget();
      if (label) {
        revealTargetItem(label);
      }
    })
  );
  context.subscriptions.push(commands.registerCommand("cf.target.delete", cmdDeleteTarget));
  context.subscriptions.push(commands.registerCommand("cf.targets.reload", cmdReloadTargets));
  context.subscriptions.push(commands.registerCommand("cf.select.space", cmdSelectSpace));
  context.subscriptions.push(commands.registerCommand("cf.deploy-service.api", cmdDeployServiceAPI));
  context.subscriptions.push(commands.registerCommand("cf.services.get-space-services", cmdGetSpaceServices));
  context.subscriptions.push(commands.registerCommand("cf.services.get-ups-services", cmdGetUpsServiceInstances));
  context.subscriptions.push(commands.registerCommand("cf.services.get-services", cmdGetServiceInstances));

  // postpone the rest of initialization after the extension is activated
  setTimeout(() => {
    void init(context, cfConfigFilePath);
  }, 10);

  return {
    // allows to external extensions to listen onDidChangeTarget event
    onDidChangeTarget,
  };
}

export function getPath() {
  return extPath;
}

export function deactivate(): void {
  const cfConfigFilePath = cfGetConfigFilePath();
  if (cfConfigFilePath) {
    fs.unwatchFile(cfConfigFilePath);
  }
}
