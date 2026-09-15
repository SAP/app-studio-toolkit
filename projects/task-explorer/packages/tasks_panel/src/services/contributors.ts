import { commands, Extension, extensions } from "vscode";
import { Dictionary, get, keys, map, uniq, zipObject } from "lodash";
import { ConfiguredTask, TaskEditorContributionAPI } from "@sap_oss/task_contrib_types";
import { getLogger } from "../logger/logger-wrapper";
import { ITaskTypeEventHandler, IContributors } from "./definitions";
import { messages } from "../i18n/messages";
import { exceptionToString } from "../utils/task-serializer";

export class Contributors implements IContributors {
  private readonly eventHandlers: ITaskTypeEventHandler[] = [];
  private readonly tasksEditorContributorsMap = new Map<string, any>();
  private static instance: IContributors | undefined;

  private constructor() {
    return;
  }

  public static getInstance(): IContributors {
    if (Contributors.instance === undefined) {
      Contributors.instance = new Contributors();
    }
    return Contributors.instance;
  }

  getIntentByType(type: string): string {
    const intent = this.tasksEditorContributorsMap.get(type)?.intent;
    return intent ?? "other";
  }

  getExtensionNameByType(type: string): string {
    return this.tasksEditorContributorsMap.get(type)?.extensionName;
  }

  getSupportedIntents(): string[] {
    const supportedTypes = Array.from(this.tasksEditorContributorsMap.keys());
    return uniq(map(supportedTypes, (_) => this.getIntentByType(_)));
  }

  getSupportedTypes(): string[] {
    return Array.from(this.tasksEditorContributorsMap.keys());
  }

  public registerEventHandler(eventHandler: ITaskTypeEventHandler): void {
    this.eventHandlers.push(eventHandler);
  }

  public getTaskEditorContributor(type: string): TaskEditorContributionAPI<ConfiguredTask> {
    return this.tasksEditorContributorsMap.get(type)?.provider;
  }

  private async getApi(extension: Extension<any>, extensionId: string): Promise<any> {
    let api: any;
    if (!extension.isActive) {
      try {
        api = await extension.activate();
      } catch (error: any) {
        throw new Error(`${messages.ACTIVATE_CONTRIB_EXT_ERROR(extensionId)}:${error.toString()}`);
      }
    } else {
      api = extension.exports;
    }
    return api;
  }

  public async init(): Promise<void> {
    // performance: attempt to scan the extensions simultaneously (but not one by one)
    return Promise.all(
      map(extensions.all, (extension) => {
        return Promise.resolve().then(() => {
          const currentPackageJSON: any = get(extension, "packageJSON");
          const contributedTypes = this.getTypesInfo(currentPackageJSON);
          if (contributedTypes && contributedTypes.size > 0) {
            const extensionName: string = get(currentPackageJSON, "name");
            return this.getApi(extension, `${get(currentPackageJSON, "publisher")}.${extensionName}`).then((api) => {
              if (typeof api?.getTaskEditorContributors === "function") {
                const tasksPropertyMessageMap = this.getTasksPropertyMessageMap(currentPackageJSON);
                api.getTaskEditorContributors().forEach((provider: any, type: string) => {
                  const typeInfo = contributedTypes.get(type);
                  if (typeInfo) {
                    if (!this.tasksEditorContributorsMap.has(type)) {
                      this.tasksEditorContributorsMap.set(type, {
                        provider: provider,
                        intent: typeInfo["intent"],
                        extensionName: extensionName,
                        properties: tasksPropertyMessageMap[type].properties,
                        requires: tasksPropertyMessageMap[type].requires,
                      });
                    } else {
                      throw new Error(messages.DUPLICATED_TYPE(type));
                    }
                  } else {
                    throw new Error(messages.MISSING_TYPE(type));
                  }
                });
              }
            });
          }
        });
      }),
    )
      .then(() => {
        setTimeout(() => {
          for (const eventHandler of this.eventHandlers) {
            eventHandler.onChange();
          }
        });
      })
      .catch((e) => {
        getLogger().error(exceptionToString(e));
      })
      .finally(() => {
        void commands.executeCommand("setContext", "ext.isViewVisible", this.tasksEditorContributorsMap.size > 0);
      });
  }

  private getTasksPropertyMessageMap(
    packageJSON: any,
  ): Record<string, { properties: Dictionary<any>; requires: string[] }> {
    const tasksDefinitions = get(packageJSON.contributes, "taskDefinitions");
    const tasksTypes = map(tasksDefinitions, (_) => _.type);
    const tasksProperties = map(tasksDefinitions, (taskDefinition) => {
      const propertiesNames: string[] = keys(taskDefinition.properties);
      const propertiesDetails: any[] = map(propertiesNames, (_) => taskDefinition.properties[_]);
      return {
        properties: zipObject(propertiesNames, propertiesDetails),
        requires: taskDefinition.required,
      };
    });
    return zipObject(tasksTypes, tasksProperties);
  }

  private getTypesInfo(packageJSON: Record<string, any>): Map<string, any> | undefined {
    let info: Map<string, any> | undefined;
    const tasksExplorerContribution = packageJSON.BASContributes?.tasksExplorer;
    if (tasksExplorerContribution) {
      info = new Map();
      for (const typeInfo of tasksExplorerContribution) {
        info.set(typeInfo["type"], typeInfo);
      }
    }
    return info;
  }

  getTaskPropertyDescription(type: string, property: string): string {
    return get(this.tasksEditorContributorsMap.get(type).properties[property], "description", "");
  }
}
