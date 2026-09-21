import * as vscode from "vscode";
import * as path from "path";
import { CFView, CFService, CFTargetTI, CFTargetNotCurrent, getTargetRoot } from "./cfView";
import { messages } from "./messages";
import * as https from "https";
import {
  updateGitIgnoreList,
  isWindows,
  toText,
  UpsServiceQueryOprions,
  ServiceQueryOptions,
  resolveFilterValue,
} from "./utils";
import {
  DEFAULT_TARGET,
  ServiceInstanceInfo,
  IServiceQuery,
  eFilters,
  Cli,
  cfGetConfigFileField,
  cfBindLocalServices,
  ServiceTypeInfo,
  cfBindLocalUps,
  cfGetInstanceMetadata,
  cfGetAuthToken,
  padQuery,
  eServiceTypes,
  CliResult,
} from "@sap/cf-tools";
import * as _ from "lodash";
import {
  getAvailableServices,
  updateServicesOnCFPageSize,
  isServiceTypeInfoInArray,
  updateInstanceNameAndTags,
  getInstanceName,
  fetchServicePlanList,
  CMD_CREATE_SERVICE,
  verifyLoginRetry,
  getUserProvidedServiceInstances,
  getServiceInstances,
  CMD_BIND_TO_DEFAULT_SERVICE,
} from "./commands";
import { stringify } from "comment-json";
import { checkAndCreateChiselTask, deleteChiselParamsFromFile } from "./chisel";
import { getModuleLogger } from "./logger/logger-wrapper";

const YES = "Yes";
const NO = "No";
const CANCEL = "Cancel";
const LOGGER_MODULE = "cfViewCommands";

interface BindDetails {
  instances: ServiceInstanceInfo[];
  tags?: string[];
  keyNames?: string[];
  serviceKeyParams?: unknown[];
}

interface BindLocalData {
  instanceName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chiselTask?: any;
}

export interface CmdOptions {
  silent?: boolean;
  "skip-reload"?: boolean;
  "quote-vcap"?: boolean;
}

export function cmdReloadTargets(): Promise<void> {
  return Promise.resolve(CFView.get().refresh());
}

async function execHttp(options: https.RequestOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    https
      .get(options, (resp) => {
        let data = "";
        // A chunk of data has been recieved.
        resp.on("data", (chunk) => {
          data += chunk;
        });
        // The whole response has been received. Print out the result.
        resp.on("end", () => {
          resolve(data);
        });
      })
      .on("error", (err) => {
        getModuleLogger(LOGGER_MODULE).error("execHttp: get failed", { error: toText(err) }, { host: options.host });
        reject(err.message);
      });
  });
}

async function askUserForPath(): Promise<vscode.Uri[] | undefined> {
  return vscode.window.showOpenDialog({
    openLabel: "Select folder for .env file",
    canSelectFiles: false,
    canSelectFolders: true,
    canSelectMany: false,
    defaultUri: vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri : undefined,
  });
}

async function getToBindInstances(
  serviceInfos: ServiceTypeInfo[],
  availableServices: ServiceInstanceInfo[],
  instanceNames: string[],
  tags: string[]
) {
  for (const serviceTypeInfo of serviceInfos) {
    await updateInstanceNameAndTags(availableServices, serviceTypeInfo, instanceNames, tags);
  }
}

type TEnvPath = {
  path: vscode.Uri;
  ignore?: boolean;
};

type BindArgs = {
  instances: ServiceInstanceInfo[];
  envPath: TEnvPath;
  tags?: string[];
  serviceKeyNames?: string[];
  serviceKeyParams?: unknown[];
  options?: CmdOptions;
};

async function doBind(opts: BindArgs) {
  async function withProgress(cb: () => Thenable<void>, services: string[]) {
    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: messages.binding_service_to_file,
        cancellable: false,
      },
      cb
    );
    const serviceNames = _.join(services, ",");
    if (!opts.options?.silent) {
      void vscode.window.showInformationMessage(messages.service_bound_successful(serviceNames));
    }
    getModuleLogger(LOGGER_MODULE).info("The service %s has been bound.", serviceNames);
  }

  const ups = _.filter(opts.instances, ["serviceName", eServiceTypes.user_provided]);
  const services = _.difference(opts.instances, ups);
  if (_.size(services)) {
    const labels = _.map(services, "label");
    const cb = () =>
      cfBindLocalServices(
        opts.envPath.path.fsPath,
        labels,
        opts.tags,
        opts.serviceKeyNames,
        opts.serviceKeyParams,
        opts.options?.["quote-vcap"]
      );
    await withProgress(cb, labels);
  }
  if (_.size(ups)) {
    const labels = _.map(ups, "label");
    const cb = () => cfBindLocalUps(opts.envPath.path.fsPath, labels, opts.tags, opts.options?.["quote-vcap"]);
    await withProgress(cb, labels);
  }
  if (!opts.envPath.ignore) {
    void updateGitIgnoreList(opts.envPath.path.fsPath);
  }
}

async function getServiceInstanceInfo(instanceName: string): Promise<ServiceInstanceInfo> {
  const data = await cfGetInstanceMetadata(instanceName);
  return {
    label: _.get(data, "serviceName"),
    serviceName: _.get(data, "service"),
    plan_guid: _.get(data, "plan_guid"),
    plan: _.get(data, "plan"),
  };
}

export async function cfDeployServiceAPI(urlPath: string): Promise<string> {
  const cfApi: string = await cfGetConfigFileField("Target");
  if (_.size(cfApi) > 0) {
    // https://api.cf.<cf domain>
    const deployServiceUrl = cfApi.replace("api.cf", "deploy-service.cfapps");

    const accessToken = (await cfGetAuthToken()).replace("\n", "").replace("\n", ""); // lgtm [js/incomplete-sanitization]

    const urlObj = new URL(deployServiceUrl);

    const options = {
      protocol: urlObj.protocol,
      host: urlObj.host,
      port: urlObj.port ? urlObj.port : urlObj.protocol === "https:" ? 443 : 80,
      method: "get",
      path: urlPath ? urlPath : urlObj.pathname,
      headers: { Authorization: accessToken },
    };

    return execHttp(options);
  }

  getModuleLogger(LOGGER_MODULE).error("No CF API endpoint", { path: urlPath });
  throw new Error(messages.no_cf_api_endpoint);
}

export async function cmdDeployServiceAPI(servicePath: string, message: string): Promise<string | undefined> {
  if (await verifyLoginRetry()) {
    return vscode.window.withProgress<string>(
      {
        location: vscode.ProgressLocation.Notification,
        title: message ? message : messages.load_data_from_deploy,
        cancellable: false,
      },
      () => cfDeployServiceAPI(servicePath)
    );
  }
}

export async function execSetTarget(item: CFTargetTI, options?: CmdOptions): Promise<void> {
  const response: CliResult = await Cli.execute(["set-target", "-f", item.target.label]);
  if (response.exitCode !== 0) {
    if (!options?.silent) {
      void vscode.window.showErrorMessage(response.stdout);
    }
    getModuleLogger(LOGGER_MODULE).error(`execSetTarget:: run 'set-target -f' with lable ${item.target.label} failed`, {
      output: response.stdout,
    });
  } else {
    if (!options?.["skip-reload"]) {
      await cmdReloadTargets();
    }
  }
}

export async function execSaveTarget(item?: CFTargetTI, options?: CmdOptions): Promise<void> {
  if (item?.contextValue !== "cf-target-notargets") {
    const response: CliResult = await Cli.execute(
      _.concat(["save-target"], item?.target.label ? ["-f", item.target.label] : [])
    );
    if (response.exitCode !== 0) {
      if (!options?.silent) {
        void vscode.window.showErrorMessage(response.stdout);
      }
      getModuleLogger(LOGGER_MODULE).error(
        `execSaveTarget:: run 'save-target -f' with lable ${item?.target.label} failed`,
        {
          output: response.stdout,
        }
      );
    }
  }
}

export async function cmdSetCurrentTarget(
  newTarget: CFTargetTI | CFTargetNotCurrent | undefined
): Promise<unknown | undefined> {
  const item = getTargetRoot(newTarget);
  if (false === item?.target?.isCurrent) {
    let answer = YES;
    try {
      const currTarget = CFView.get().getCurrentTarget();
      if (currTarget?.isDirty) {
        answer = await vscode.window
          .showWarningMessage(messages.target_dirty_save(currTarget.label), YES, NO, CANCEL)
          .then((selection) => {
            if (selection === YES) {
              return execSaveTarget().then(() => selection);
            } else if (selection) {
              return NO;
            }
            // if ESC was pressend and selection is undefined
            return CANCEL;
          });
      }

      if (answer === CANCEL) {
        return;
      }

      return execSetTarget(item);
    } catch (e) {
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-argument */
      void vscode.window.showErrorMessage(toText(e));
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-argument */
      getModuleLogger(LOGGER_MODULE).error(
        `cmdSetCurrentTargetCommand with new target ${stringify(newTarget)} exception thrown`,
        /* eslint-disable-next-line @typescript-eslint/no-unsafe-argument */
        { error: toText(e) }
      );
    }
  }
}

export async function cmdDeleteTarget(item: CFTargetTI, options?: CmdOptions): Promise<void> {
  const targetLabel = item.target.label;
  if (targetLabel === DEFAULT_TARGET) {
    return;
  }
  const cliResult = await Cli.execute(["delete-target", targetLabel]);
  if (cliResult.exitCode === 0) {
    if (!options?.["skip-reload"]) {
      await cmdReloadTargets();
    }
    if (!options?.silent) {
      void vscode.window.showInformationMessage(messages.target_deleted(targetLabel));
    }
    getModuleLogger(LOGGER_MODULE).debug(`cmdDeleteTarget:: command "delete-target" of ${targetLabel} succeeded.`);
  } else {
    void vscode.window.showErrorMessage(cliResult.stdout);
    getModuleLogger(LOGGER_MODULE).error(`cmdSetCurrentTargetCommand:: run 'delete-target of ${targetLabel} failed`, {
      output: cliResult.stdout,
    });
  }
}

export async function cmdGetSpaceServices(
  query?: IServiceQuery,
  progressTitle?: string
): Promise<ServiceInstanceInfo[]> {
  _.each(query?.filters, (filter) => {
    filter.value = encodeURIComponent(filter.value);
  });
  return getAvailableServices({ query, ups: { isShow: true } }, progressTitle);
}

async function composeQueryToObtainInstances(serviceInfos: ServiceTypeInfo[]): Promise<IServiceQuery | undefined> {
  let query;
  if (_.get(serviceInfos, ["0", "plan"])) {
    query = padQuery((query as unknown) as IServiceQuery, [
      { key: eFilters.service_plan_names, value: resolveFilterValue(serviceInfos[0].plan) },
    ]);
  }
  if (/*!_.size(plans) &&*/ _.get(serviceInfos, "[0].name")) {
    if (eServiceTypes.user_provided === serviceInfos[0].name) {
      query = padQuery((query as unknown) as IServiceQuery, [
        { key: eFilters.service_plan_names, value: "nothing-to-show" },
      ]); // tricky - to show the only user-provided instances
    } else {
      const guids = _.map(
        await fetchServicePlanList({
          filters: [{ key: eFilters.service_offering_names, value: resolveFilterValue(serviceInfos[0].name) }],
        }),
        "guid"
      );
      query = padQuery((query as unknown) as IServiceQuery, [
        { key: eFilters.service_plan_guids, value: _.join(guids) },
      ]);
    }
  }
  return query;
}

async function collectBindDetails(
  service: CFService | ServiceTypeInfo[],
  requstedInstance?: string
): Promise<BindDetails | undefined> {
  let details;

  if (_.get(service, "contextValue") === "cf-service" && _.get(service, "label")) {
    details = {
      instances: [{ label: (service as CFService).label, serviceName: (service as CFService).type || "unknown" }],
    };
  } else {
    // service is ServiceTypeInfo
    const query = await composeQueryToObtainInstances(service as ServiceTypeInfo[]);
    let availableServices = await getAvailableServices({ query, ups: _.get(service, ["0", "ups"]) });
    if (_.isEmpty(availableServices)) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      getModuleLogger(LOGGER_MODULE).debug(`No services found for plan ${_.get(service, "[0].plan")}`);
      if (!_.find(service as ServiceTypeInfo[], "allowCreate")) {
        void vscode.window.showInformationMessage(messages.no_services_instances_found);
        return details;
      }
    }

    updateServicesOnCFPageSize(availableServices);

    if (isServiceTypeInfoInArray(service)) {
      const instanceNames: string[] = [];
      const tags: string[] = [];
      const serviceTypeInfos = service as ServiceTypeInfo[];
      if (!requstedInstance) {
        for (const serviceTypeInfo of serviceTypeInfos) {
          if (serviceTypeInfo.allowCreate) {
            // add 'create service' menu item
            availableServices = _.concat([{ label: CMD_CREATE_SERVICE, serviceName: "" }], availableServices);
            if (_.size(availableServices) && !_.isEmpty(serviceTypeInfo.allowCreate.name)) {
              // add 'Bind to the default service instance' menu item
              availableServices = _.concat(
                [
                  {
                    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
                    label: `${CMD_BIND_TO_DEFAULT_SERVICE}${serviceTypeInfo.allowCreate.name}`,
                    plan: serviceTypeInfo.allowCreate.plan,
                    serviceName: serviceTypeInfo.allowCreate.serviceName ?? "",
                  },
                ],
                availableServices
              );
            }
          }
          await updateInstanceNameAndTags(availableServices, serviceTypeInfo, instanceNames, tags);
        }
      } else {
        let foundInstance = _.find(availableServices, ["label", requstedInstance]);
        if (!foundInstance) {
          foundInstance = await getServiceInstanceInfo(requstedInstance).catch(() => undefined);
          if (!foundInstance) {
            throw new Error(messages.no_services_instance_byname_found(requstedInstance));
          }
          availableServices.push(foundInstance);
        }
        instanceNames.push(foundInstance.label);
        tags.push(serviceTypeInfos[0].tag);
      }

      if (_.size(instanceNames) > 0) {
        const serviceKeyNames: string[] = _.compact(
          _.flatMap(serviceTypeInfos, (serviceTypeInfo) => serviceTypeInfo.serviceKeyName)
        );
        const serviceKeyParams: unknown[] = _.compact(_.map(serviceTypeInfos, "serviceKeyParam"));
        const instances = [];
        for (const name of instanceNames) {
          let serviceInstance = _.find(availableServices, ["label", name]);
          // seems like it just created service and it is needed to fetch it's info
          if (!serviceInstance) {
            serviceInstance = await getServiceInstanceInfo(name);
          }
          instances.push(serviceInstance);
        }
        details = {
          instances: _.compact(instances),
          tags: _.compact(tags),
          keyNames: serviceKeyNames,
          serviceKeyParams,
        };
      }
    } else {
      const instanceName = await getInstanceName(availableServices);
      if (instanceName) {
        details = { instances: [{ label: instanceName, serviceName: "unknown" }] };
      }
    }
  }
  return details;
}

class EnvPathHelper {
  static getPath(env: vscode.Uri | TEnvPath): vscode.Uri {
    return _.get(env, "fsPath")
      ? (env as vscode.Uri)
      : _.get(env, "path")
      ? (env.path as vscode.Uri)
      : vscode.Uri.file("");
  }
  static getIgnore(env: vscode.Uri | TEnvPath): boolean {
    return (_.get(env, "ignore") as boolean) || false;
  }
  static isPathEmpty(value: vscode.Uri): boolean {
    return value.scheme === "file" && value.fsPath === (isWindows ? "\\" : "/");
  }
}

export async function cmdBindLocal(
  service: CFService | ServiceTypeInfo[],
  envPath: vscode.Uri | TEnvPath,
  instanceName?: string,
  opts?: CmdOptions
): Promise<BindLocalData | undefined> {
  // Handle .env path
  let filePath = EnvPathHelper.getPath(envPath);
  if (EnvPathHelper.isPathEmpty(filePath)) {
    const uriArray = await askUserForPath();
    if (_.size(uriArray) === 0) {
      // aborted
      return;
    }
    /* eslint-disable-next-line @typescript-eslint/no-unsafe-argument */
    filePath = vscode.Uri.file(path.join(_.get(uriArray, "[0].fsPath"), ".env"));
  }
  try {
    const bindDetails = await collectBindDetails(service, instanceName);
    if (bindDetails) {
      await doBind({
        instances: bindDetails.instances,
        envPath: { path: filePath, ignore: EnvPathHelper.getIgnore(envPath) },
        tags: bindDetails.tags,
        serviceKeyNames: bindDetails.keyNames,
        serviceKeyParams: bindDetails.serviceKeyParams,
        options: opts,
      });
      const instanceName = _.get(_.head(bindDetails.instances), "label");
      if (instanceName) {
        const chiselTask = await checkAndCreateChiselTask(filePath.fsPath, instanceName);
        if (chiselTask) {
          await deleteChiselParamsFromFile(filePath.fsPath);
        }
        return chiselTask ? { instanceName, chiselTask } : { instanceName };
      }
    }
  } catch (e) {
    if (e) {
      // login to cf canceled by user
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-argument */
      void vscode.window.showErrorMessage(toText(e));
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-argument */
      getModuleLogger(LOGGER_MODULE).error(
        `cmdBindLocal exception thrown`,
        { error: toText(new Error(e?.message as string)) },
        { service: service },
        { envPath: filePath },
        { instanceName: instanceName }
      );
    }
  }
  return;
}

export async function bindLocalService(
  serviceInfos: ServiceTypeInfo[],
  envPath: vscode.Uri | TEnvPath,
  opts?: CmdOptions
): Promise<string[] | undefined> {
  try {
    const filePath = EnvPathHelper.getPath(envPath);
    if (EnvPathHelper.isPathEmpty(filePath)) {
      return [];
    }
    const query = await composeQueryToObtainInstances(serviceInfos);
    const availableServices: ServiceInstanceInfo[] = await getAvailableServices({ query });
    if (_.isEmpty(availableServices)) {
      if (!_.isEmpty(_.get(serviceInfos, ["0", "plan"]))) {
        getModuleLogger(LOGGER_MODULE).debug(`No service found for the plan ${serviceInfos[0].plan}`);
      }
      if (!_.find(serviceInfos, "allowCreate")) {
        void vscode.window.showInformationMessage(messages.no_services_instances_found);
      }
      return [];
    }

    updateServicesOnCFPageSize(availableServices);

    if (isServiceTypeInfoInArray(serviceInfos)) {
      const instanceNames: string[] = [];
      const tags: string[] = [];
      await getToBindInstances(serviceInfos, availableServices, instanceNames, tags);
      const instances = _.reduce(
        instanceNames,
        (result, name) => {
          result.push(_.find(availableServices, ["label", name]));
          return result;
        },
        <(ServiceInstanceInfo | undefined)[]>[]
      );
      if (_.size(instanceNames) > 0) {
        await doBind({
          instances: _.compact(instances),
          envPath: { path: filePath, ignore: EnvPathHelper.getIgnore(envPath) },
          tags: _.compact(tags),
          options: opts,
        });
        return instanceNames;
      }
    } else {
      const instanceName = await getInstanceName(availableServices);
      if (instanceName) {
        const service = _.find(availableServices, ["label", instanceName]);
        await doBind({
          instances: service ? [service] : [],
          envPath: { path: filePath, ignore: EnvPathHelper.getIgnore(envPath) },
          options: opts,
        });
        return [instanceName];
      }
    }
  } catch (e) {
    /* eslint-disable-next-line @typescript-eslint/no-unsafe-argument */
    void vscode.window.showErrorMessage(toText(e));
    /* eslint-disable-next-line @typescript-eslint/no-unsafe-argument */
    getModuleLogger(LOGGER_MODULE).error(
      `bindLocalService exception thrown`,
      { error: toText(new Error(e?.message as string)) },
      { serviceInfos: serviceInfos },
      { envPath: EnvPathHelper.getPath(envPath) }
    );
  }
}

export async function cmdGetUpsServiceInstances(
  options?: UpsServiceQueryOprions,
  progressTitle?: string
): Promise<ServiceInstanceInfo[]> {
  return getUserProvidedServiceInstances(options, progressTitle);
}

export async function cmdGetServiceInstances(
  serviceQueryOptions?: ServiceQueryOptions,
  progressTitle?: string
): Promise<ServiceInstanceInfo[]> {
  let query: IServiceQuery | undefined;
  if (serviceQueryOptions) {
    // prepare a query to filter the service list by service plan (e.g.: hdi-shared)
    // filter the list by service type name (e.g.: hana, hanatrial)
    const serviceInfo = {
      name: serviceQueryOptions.name || "",
      plan: serviceQueryOptions.plan || "",
      tag: serviceQueryOptions.tag || "",
      prompt: "",
    };
    query = await composeQueryToObtainInstances([serviceInfo]);
  }
  return getServiceInstances(query, progressTitle);
}
