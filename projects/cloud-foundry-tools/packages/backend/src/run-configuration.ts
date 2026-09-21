import * as types from "@sap/wing-run-config-types";
import * as cfViewCommands from "./cfViewCommands";
import { getEnvResources, removeResourceFromEnv, toText } from "./utils";
import { checkAndCreateChiselTask } from "./chisel";
import * as _ from "lodash";
import * as vscode from "vscode";
import * as cfLocal from "@sap/cf-tools";
import { messages } from "./messages";
import { getModuleLogger } from "./logger/logger-wrapper";

export class DependencyHandler implements types.IDependencyHandler {
  private readonly id: string;
  private static readonly MODULE_NAME = "DependencyHandler"; // workarround in minimized mode

  constructor(id: string) {
    this.id = id;
  }

  public async getBindState(bindContext: types.IBindContext): Promise<types.BindState> {
    let bindState = types.BindState.notbound;

    try {
      if (
        _.get(
          (await getEnvResources(_.get(bindContext, ["envPath", "fsPath"]))).vcapObject,
          _.get(bindContext, ["depContext", "type"])
        )
      ) {
        bindState = types.BindState.cloud;
      }
    } catch (e) {
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-argument */
      void vscode.window.showErrorMessage(toText(e));
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-argument */
      getModuleLogger(DependencyHandler.MODULE_NAME).error("getBindState: processing failed", { exception: toText(e) });
    }
    return bindState;
  }

  public async bind(
    bindContext: types.IBindContext,
    options?: cfViewCommands.CmdOptions
  ): Promise<void | types.IBindResult> {
    const resourceTag: string = _.get(bindContext, "depContext.data.resourceTag");
    const serviceType: cfLocal.ServiceTypeInfo[] = [
      {
        name: _.get(bindContext.depContext, ["type"], ""),
        plan: _.get(bindContext.depContext, ["data", "plan"], ""),
        // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
        tag: resourceTag ? resourceTag + _.get(bindContext, "depContext.data.resourceName") : "",
        prompt: "",
      },
    ];
    try {
      const instanceNames = await cfViewCommands.bindLocalService(serviceType, bindContext.envPath, options);
      let chiselTask;
      if (_.size(instanceNames)) {
        // Get metadata of service instance by service name
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const instanceType: string = (await cfLocal.cfGetInstanceMetadata(_.get(instanceNames, "[0]"))).service;

        // Create chisel task if neccessary
        if (_.get(bindContext, "depContext.data.isCreateChiselTask") || /^hana(trial)?$/.test(instanceType)) {
          // Create it in dependent task
          const chiselTaskNameSuffix = instanceNames?.join("&") || "";
          chiselTask = await checkAndCreateChiselTask(bindContext.envPath?.fsPath, chiselTaskNameSuffix);
          if (chiselTask) {
            if (!options?.silent) {
              // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
              void vscode.window.showInformationMessage(
                `A task for opening the VPN tunnel to the Cloud Foundry space has been created. Name: '${chiselTask.label}'`
              );
            }
            getModuleLogger(DependencyHandler.MODULE_NAME).info(
              "bind: <%s> task for opening the VPN tunnel to the Cloud Foundry space has been created",
              chiselTask.label
            );

            if (_.isNil(bindContext.configData.dependentTasks)) {
              // eslint-disable-next-line require-atomic-updates
              bindContext.configData.dependentTasks = [];
            }
            bindContext.configData.dependentTasks.push(chiselTask);
          }
        }
        return _.merge(
          {
            configData: bindContext.configData,
            resource: {
              name: _.get(instanceNames, "[0]"),
              type: instanceType || "",
            },
          },
          chiselTask ? { resource: { data: { chiselTask } } } : {}
        );
      }
    } catch (e) {
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-argument */
      void vscode.window.showErrorMessage(toText(e));
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-argument */
      getModuleLogger(DependencyHandler.MODULE_NAME).error("bind: processing failed", { exception: toText(e) });
    }
  }

  public async unbind(
    bindContext: types.IBindContext,
    options?: cfViewCommands.CmdOptions
  ): Promise<void | types.IBindResult> {
    const configObject = new types.ConfigObject({}, types.ConfigurationTarget.launch);
    const configurationData: types.IConfigurationData = { config: configObject, dependentTasks: [] };
    try {
      const removedResourceDetails = await removeResourceFromEnv(bindContext);
      if (!options?.silent) {
        void vscode.window.showInformationMessage(
          messages.service_unbound_successful(_.get(removedResourceDetails, "resourceName"))
        );
      }
      getModuleLogger(DependencyHandler.MODULE_NAME).info(
        "unbind: the <%s> service has been unbound",
        _.get(removedResourceDetails, "resourceName")
      );
      return Promise.resolve({
        configData: configurationData,
        resource: {
          name: _.get(removedResourceDetails, "resourceName") || "",
          type: _.get(removedResourceDetails, "resourceData.label") || "",
          data: _.get(removedResourceDetails, "resourceData") || {},
        },
      });
    } catch (e) {
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-argument */
      void vscode.window.showErrorMessage(toText(e));
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-argument */
      getModuleLogger(DependencyHandler.MODULE_NAME).error("unbind: processing failed", { exception: toText(e) });
    }
  }

  public getId(): string {
    return this.id;
  }
}
