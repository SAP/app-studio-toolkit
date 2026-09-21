import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { messages } from "./messages";
import * as types from "@sap/wing-run-config-types";
import * as _ from "lodash";
import * as PropertiesReader from "properties-reader";
import { parse } from "comment-json";
import { EOL, platform } from "os";
import {
  IServiceQuery,
  ServiceInstanceInfo,
  cfGetUpsInstances,
  eFilters,
  ServiceTypeInfo,
  cfGetManagedServiceInstances,
  cfGetTarget,
} from "@sap/cf-tools";
import { getModuleLogger } from "./logger/logger-wrapper";
import { existsSync } from "fs";

export const isWindows = platform().includes("win");
type TypeValidationResult = string | undefined | null;

const LOGGER_MODULE = "utils";

export interface DisplayServices {
  query?: IServiceQuery;
  ups?: ServiceTypeInfo["ups"];
}

export interface BaseServiceQueryOptions {
  tag?: string; // service tags
  credentials?: {
    tag?: string;
  };
}

export type UpsServiceQueryOprions = BaseServiceQueryOptions;

export interface ServiceQueryOptions extends BaseServiceQueryOptions {
  name?: string; //service type name
  plan?: string; //Service plan
}

function spotRedirectUri() {
  // expected host pattern is 'DOMAIN.PLATFORM.REG...APPNAME.cloud.sap'
  const urlInput: string =
    _.get(process, "env.WS_BASE_URL") ||
    "https://wingtestsubacc-workspaces-ws-gwzd6.staging-01.dev10.int.webide.cloud.sap";
  const host = new URL(urlInput).hostname;
  // "https://*.cry10.int.applicationstudio.cloud.sap/**"
  return `https://*.${_.join(_.drop(_.split(host, ".")), ".")}/**`;
}

export const ENV_VCAP_RESOURCES = "VCAP_SERVICES";

export function toText(e: Error): string {
  return _.get(e, "message") || _.get(e, "name", _.toString(e));
}

export function getEnvResources(envFilePath: string): Promise<{ vcapObject: any; isQuotedVcap: boolean }> {
  try {
    let isQuotedVcap = false;
    if (existsSync(envFilePath)) {
      const envProperties = PropertiesReader(envFilePath);
      let vcapProperty = envProperties.getRaw(ENV_VCAP_RESOURCES);
      if (vcapProperty) {
        // In case VCAP_SERVICES is wrapped with single quotes - unwrap it
        if (_.startsWith(vcapProperty, "'") && _.endsWith(vcapProperty, "'")) {
          vcapProperty = vcapProperty.substring(1, vcapProperty.length - 1);
          isQuotedVcap = true;
        }
        return Promise.resolve({ vcapObject: JSON.parse(vcapProperty), isQuotedVcap });
      } else {
        getModuleLogger(LOGGER_MODULE).debug(
          "getEnvResources: the '.env' file is missing a key <%s>",
          ENV_VCAP_RESOURCES,
          { filePath: envFilePath }
        );
        return Promise.resolve({ vcapObject: null, isQuotedVcap });
      }
    } else {
      getModuleLogger(LOGGER_MODULE).debug("getEnvResources: the '.env' file does not exist", {
        filePath: envFilePath,
      });
      return Promise.resolve({ vcapObject: null, isQuotedVcap });
    }
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    getModuleLogger(LOGGER_MODULE).error(
      "getEnvResources: could not get the '.env' file resources",
      { exception: toText(new Error(error?.message as string)) },
      { filePath: envFilePath }
    );
    throw error;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findServiceByResourceNameTag(vcapServices: any, yamlResourceName: string, resourceTag: string): any {
  for (const key in vcapServices) {
    for (const service of vcapServices[key]) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      if (
        service.tags &&
        service.tags.find((t: string) => t.startsWith(resourceTag) && t.substr(resourceTag.length) === yamlResourceName)
      ) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return [key, service];
      }
    }
  }
  return undefined;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function removeResourceFromEnv(
  bindContext: types.IBindContext
): Promise<{ resourceName: string; envPath: string; resourceData: any }> {
  let instanceData;
  const envFilePath: string = bindContext.envPath.fsPath;
  const envResources = await getEnvResources(envFilePath);
  const vcapServicesObj = envResources.vcapObject;
  const bindResourceType =
    bindContext.depContext.type === types.DependencyType.runtimeservice
      ? bindContext.depContext.displayType
      : bindContext.depContext.type;
  let instanceName = "";
  // If this is a tagged resource - remove by tag
  const resourceTag: string = _.get(bindContext, "depContext.data.resourceTag");
  const resourceName: string = _.get(bindContext, "depContext.data.resourceName");
  if (!_.isEmpty(resourceTag)) {
    const keyAndService = findServiceByResourceNameTag(vcapServicesObj, resourceName, resourceTag);
    if (!_.isEmpty(keyAndService)) {
      const resourceTypeKey = keyAndService[0];
      instanceData = keyAndService[1];
      instanceName = instanceData.instance_name;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      _.remove(vcapServicesObj[resourceTypeKey], (hanaService: any) => {
        return hanaService.instance_name === instanceName;
      });
      // If after removal no service instances left - remove this resource type completely to prevent something like: VCAP_SERVICES={"hana":[]}
      if (_.isEmpty(vcapServicesObj[resourceTypeKey])) {
        delete vcapServicesObj[resourceTypeKey];
      }
    } else {
      getModuleLogger(
        LOGGER_MODULE
      ).debug(
        "removeResourceFromEnv: the <%s> tagged <%s> resource was not found in the '.env' file",
        resourceTag,
        resourceName,
        { filePath: envFilePath }
      );
    }
  } else {
    // Remove by resource dependency type only
    const serviceToDelete = _.get(vcapServicesObj, bindResourceType);
    if (!_.isEmpty(serviceToDelete)) {
      instanceData = serviceToDelete[0];
      instanceName = instanceData.instance_name;
      delete vcapServicesObj[bindResourceType];
    }
  }

  // Update VCAP_SERVICES in the .env file
  const envProperties = PropertiesReader(envFilePath);

  // If VCAP_SERVICES was already wrapped with single quotes - maintain them when writing back
  const quote = envResources.isQuotedVcap ? "'" : "";
  envProperties.set(ENV_VCAP_RESOURCES, quote + JSON.stringify(vcapServicesObj) + quote);

  await envProperties.save(envFilePath);
  return { resourceName: instanceName, envPath: envFilePath, resourceData: instanceData };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function generateParams4Service(serviceLabel: string, plan: string): any {
  if ("xsuaa" === serviceLabel && "application" === plan) {
    return {
      xsappname: `xsuaa_${_.now()}`,
      "tenant-mode": "dedicated",
      description: "Security profile of called application",
      scopes: [
        {
          name: "uaa.user",
          description: "UAA",
        },
      ],
      "role-templates": [
        {
          name: "Token_Exchange",
          description: "UAA",
          "scope-references": ["uaa.user"],
        },
      ],
      "oauth2-configuration": {
        "redirect-uris": [`${spotRedirectUri()}`],
      },
    };
  }
  return {};
}

function validateXsuaaTenantMode(value: string) {
  if (!_.isUndefined(value) && !["shared", "dedicated", "external"].includes(_.trim(value))) {
    throw new Error(messages.error_service_params_value_not_allowed("tenant-mode"));
  }
}

function validateXsuaaOauth2Configuration(value: unknown) {
  for (const uri of _.get(value, "redirect-uris", [])) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    if (!_.startsWith(uri, "http") && !_.startsWith(uri, "localhost")) {
      throw new Error(messages.error_service_params_value_not_allowed("redirect-uris"));
    }
  }
}

function validateXsuaaName(value: string) {
  value = _.trim(value);
  if (!value) {
    throw new Error(messages.error_service_params_mandatory("xsappname"));
  }
  if (_.size(value) >= 100) {
    throw new Error(messages.error_service_params_max_length("xsappname", 100));
  }
  if (/[^a-zA-Z0-9_\-"]/gm.test(value)) {
    throw new Error(messages.error_service_params_value_not_allowed("xsappname"));
  }
}

function validateParamsXsuaa(value: string): TypeValidationResult {
  let result;
  try {
    const data = parse(_.trim(value));
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    validateXsuaaName(_.get(data, "xsappname"));
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    validateXsuaaTenantMode(_.get(data, "tenant-mode"));
    validateXsuaaOauth2Configuration(_.get(data, "oauth2-configuration"));
  } catch (e) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    result = toText(e);
  }
  return result;
}

function validateParamsJson(value: string): TypeValidationResult {
  let result;
  try {
    parse(_.trim(value));
  } catch (e) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    result = toText(e);
  }
  return result;
}

export function validateParams(serviceLabel: string, plan?: string): (value: string) => TypeValidationResult {
  return "xsuaa" === serviceLabel && "application" === plan ? validateParamsXsuaa : validateParamsJson;
}

export function isRegexExpression(statement: string): boolean {
  return /^\/\S+\/$/g.test(statement);
}

export function composeFilterPattern(value: string): string {
  return value ? (isRegexExpression(value) ? _.trim(value, "/") : `^${value}$`) : value;
}

async function doGetUpsServiceInstances(query?: IServiceQuery, filterCredTag?: string): Promise<ServiceInstanceInfo[]> {
  const upsServices = await cfGetUpsInstances(query);
  const pattern = _.size(upsServices) && filterCredTag ? composeFilterPattern(filterCredTag) : undefined;
  const ups2Show = pattern
    ? upsServices.filter((service) => {
        // cretentials.tags can be 'string', 'string array' or 'array of objects' only
        const tags = _.isString(service.credentials?.tags) ? [service.credentials.tags] : service.credentials?.tags;
        return _.find(tags, (tag: string) => new RegExp(pattern).test(tag));
      })
    : upsServices;
  return ups2Show;
}

export async function getUpsServiceInstances(options?: UpsServiceQueryOprions): Promise<ServiceInstanceInfo[]> {
  return doGetUpsServiceInstances(undefined, options?.credentials?.tag);
}

export async function getAllServiceInstances(opts?: DisplayServices): Promise<ServiceInstanceInfo[]> {
  let ups2Show: ServiceInstanceInfo[] = [];
  if (opts?.ups?.isShow || opts?.ups?.tag) {
    const copyQuery = _.cloneDeep(opts.query);
    _.remove(copyQuery?.filters || [], (item) => {
      return !_.includes(
        [
          eFilters.names,
          eFilters.space_guids,
          eFilters.organization_guids,
          eFilters.oder_by,
          eFilters.page,
          eFilters.per_page,
          eFilters.updated_ats,
          eFilters.created_ats,
        ],
        item.key
      );
    });
    ups2Show = await doGetUpsServiceInstances(copyQuery, opts.ups.tag);
  }
  return _.concat(await cfGetManagedServiceInstances(opts?.query), ups2Show);
}

const UTF8 = "utf8";
const GITIGNORE = ".gitignore";

export async function updateGitIgnoreList(envPath: string): Promise<void> {
  const project = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(envPath));
  if (project) {
    const isNotEmptyPattern = (value: string): boolean => {
      return _.size(value) > 0 && !/^\s*#/.test(value);
    };
    const isPatternFound = async (patterns: string[]): Promise<boolean> => {
      for (const pattern of patterns) {
        if (
          isNotEmptyPattern(pattern) &&
          _.includes(
            _.map(await vscode.workspace.findFiles(new vscode.RelativePattern(project, pattern)), "fsPath"),
            envPath
          )
        ) {
          return true;
        }
      }
      return false;
    };
    const ignoreFiles = await vscode.workspace.findFiles(new vscode.RelativePattern(project, GITIGNORE));
    if (!_.size(ignoreFiles)) {
      try {
        // .gitignore file not exists -> create one
        const filePath = path.normalize(path.join(project.uri.fsPath, GITIGNORE));
        await fs.promises.open(filePath, "w");
        ignoreFiles.push(vscode.Uri.file(filePath));
      } catch (e) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        getModuleLogger(LOGGER_MODULE).error("updateGitIgnoreList: creation .gitignore file failed", {
          exception: toText(new Error(e?.message as string)),
        });
      }
    }
    for (const file of ignoreFiles) {
      try {
        const patterns = _.split(await fs.promises.readFile(file.fsPath, { encoding: UTF8 }), EOL);
        if (!(await isPatternFound(patterns))) {
          await fs.promises.writeFile(
            file.fsPath,
            _.join(
              _.concat(patterns, [
                `# auto generated wildcard`,
                _.replace(path.relative(project.uri.fsPath, envPath), /\\/g, "/"),
              ]),
              EOL
            ),
            { encoding: UTF8 }
          );
        }
      } catch (e) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        getModuleLogger(LOGGER_MODULE).error(
          "updateGitIgnoreList: update .gitignore file failed",
          { exception: toText(new Error(e?.message as string)) },
          { filePath: file }
        );
      }
    }
  }
}

export async function writeProperties(filePath: string, properties: Record<string, string>): Promise<void> {
  let text = "";
  Object.keys(properties).forEach((key) => {
    const value = properties[key];
    if (value) {
      text += `${key}=${value.trim()}\n`;
    }
  });
  await fs.promises.writeFile(filePath, text);
}

export function resolveFilterValue(value: string | undefined): string {
  // allowed patterns: 'hana'|' "hana ", " xsuaa"'|'["xsuaa", "hana"]'
  // eslint-disable-next-line @typescript-eslint/unbound-method
  return _.join(_.map(_.isString(value) ? _.split(value, ",") : value, _.trim));
}

export function notifyWhenServicesInfoResultIncomplete(
  list: Promise<ServiceInstanceInfo[]>
): Promise<ServiceInstanceInfo[]> {
  const isUnknown = (value: string | undefined) => "unknown" === value;
  return list.then((infos) => {
    const results = _.reduce(
      infos,
      (res, info) => {
        if (isUnknown(info.serviceName) || isUnknown(info.plan)) {
          res.push(info.label);
        }
        return res;
      },
      <string[]>[]
    );
    if (_.size(results)) {
      void vscode.window.showWarningMessage(messages.service_instances_list_incomplete(results));
    }
    return infos;
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function examCFTarget(errorMessage: string, keys: string[], weak: boolean): Promise<any> {
  const target = await cfGetTarget();
  if (weak) {
    return target;
  }
  return _.reduce(
    keys,
    (cond, key) => {
      cond = cond && _.get(target, key);
      return cond;
    },
    true
  )
    ? target
    : Promise.reject(new Error(errorMessage));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function invokeLongFunctionWithProgress(longFunction: any, progressMessage: string): Thenable<any> {
  return vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Window,
      title: progressMessage,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    },
    () => longFunction()
  );
}
