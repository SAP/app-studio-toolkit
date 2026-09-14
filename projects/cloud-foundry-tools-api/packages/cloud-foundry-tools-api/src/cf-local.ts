/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { parse, stringify } from "comment-json";
import * as _ from "lodash";
import { Cli } from "./cli";
import { messages } from "./messages";
import {
  ProgressHandler,
  CliResult,
  CFResource,
  CancellationToken,
  CFTarget,
  ServiceInstanceInfo,
  ServiceInfo,
  PlanInfo,
  DEFAULT_TARGET,
  IServiceQuery,
  NEW_LINE,
  OK,
  eFilters,
  IServiceFilters,
  eOperation,
  ITarget,
  UpsTypeInfo,
  eServiceTypes,
  Api,
  SSOLoginOptions,
  CredentialsLoginOptions,
  Organization,
  Space,
} from "./types";
import {
  ensureQuery,
  getDescription,
  getGuid,
  getLabel,
  getName,
  getOrgGUID,
  getSpaceGuidThrowIfUndefined,
  getTags,
  isUpsType,
  padQuery,
  padQuerySpace,
  parseRawDictData,
} from "./utils";
import { SpawnOptions } from "child_process";
import { URL } from "url";

const baseParams = [
  eFilters.page,
  eFilters.per_page,
  eFilters.oder_by,
  eFilters.label_selector,
  eFilters.created_ats,
  eFilters.updated_ats,
];

interface ResourceFilters {
  name: string;
  params: string[];
}

const resourceServiceInstances: ResourceFilters = {
  name: "service_instances",
  params: _.uniq(
    _.concat(baseParams, [
      eFilters.names,
      eFilters.type,
      eFilters.space_guids,
      eFilters.organization_guids,
      eFilters.service_plan_guids,
      eFilters.service_plan,
      eFilters.service_plan_names,
    ]),
  ),
};

const resourceOrganizations: ResourceFilters = {
  name: "organizations",
  params: _.uniq(_.concat(baseParams, [eFilters.names, eFilters.guids])),
};

const resourceSpaces: ResourceFilters = {
  name: "spaces",
  params: _.uniq(_.concat(baseParams, [eFilters.names, eFilters.guids, eFilters.organization_guids, eFilters.include])),
};

const resourceServicePlan: ResourceFilters = {
  name: "service_plan",
  params: _.uniq(
    _.concat(baseParams, [
      eFilters.names,
      eFilters.guids,
      eFilters.available,
      eFilters.broker_catalog_ids,
      eFilters.space_guids,
      eFilters.organization_guids,
      eFilters.service_broker_guids,
      eFilters.service_broker_names,
      eFilters.service_offering_guids,
      eFilters.service_offering_names,
      eFilters.service_instance_guids,
      eFilters.include,
    ]),
  ),
};

const resourceServiceOfferings: ResourceFilters = {
  name: "service_offerings",
  params: _.uniq(
    _.concat(baseParams, [
      eFilters.names,
      eFilters.available,
      eFilters.service_broker_guids,
      eFilters.service_broker_names,
      eFilters.space_guids,
      eFilters.organization_guids,
    ]),
  ),
};

const resourceServiceCredentialsBinding: ResourceFilters = {
  name: "service_credential_bindings",
  params: _.uniq(
    _.concat(baseParams, [
      eFilters.names,
      eFilters.guids,
      eFilters.include,
      eFilters.service_instance_guids,
      eFilters.broker_catalog_ids,
      eFilters.space_guids,
      eFilters.service_instance_names,
      eFilters.app_guids,
      eFilters.app_names,
      eFilters.service_plan_names,
      eFilters.service_offering_guids,
      eFilters.service_offering_names,
      eFilters.type,
    ]),
  ),
};

const resourceApps: ResourceFilters = {
  name: "apps",
  params: _.uniq(
    _.concat(baseParams, [
      eFilters.names,
      eFilters.space_guids,
      eFilters.organization_guids,
      eFilters.guids,
      eFilters.include,
    ]),
  ),
};

function evaluateResponse(data: any): any {
  if (_.size(_.get(data, "errors"))) {
    throw new Error(
      `${_.get(data, ["errors", "0", "detail"])} [code: ${_.get(data, ["errors", "0", "code"])} title: ${_.get(data, [
        "errors",
        "0",
        "title",
      ])}]`,
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return data;
}

export async function resolveEndpoint(query: string): Promise<string> {
  try {
    return /http/.test(new URL(query).protocol)
      ? _.replace(query, (await cfGetTarget(true))["api endpoint"], "")
      : query;
  } catch (e) {
    // TypeError - query is in invalid format
    return query;
  }
}

let cacheServiceInstanceTypes: any = {};
export function clearCacheServiceInstances(): void {
  cacheServiceInstanceTypes = {};
}

function evaluateQueryFilters(query: IServiceQuery, resource: ResourceFilters) {
  _.each(query?.filters, (filter) => {
    if (!resource.params.includes(filter.key)) {
      throw new Error(messages.not_allowed_filter(filter.key, resource.name));
    }
  });
}

const ENTITY_STATE_INPROGRESS = "in progress";
const ENTITY_STATE_FAILED = "failed";

function composeQuery(query: IServiceQuery): string {
  query = ensureQuery(query);
  function _generate_statement(filter: IServiceFilters): string {
    const value = _.get(filter, "value");
    if (value) {
      return filter.op === eOperation.fields
        ? `${filter.op}[${filter.key}]=${value}`
        : `${filter.key}` + (filter.op ? `[${filter.op}]` : ``) + `=${value}`;
    }
  }
  function _queryFilters(filters: IServiceFilters[]): string[] {
    return _.compact(_.values(_.map(filters, _generate_statement)));
  }
  function _queryParams(object: any): string[] {
    return _.compact(
      _.map(_.keys(object), (key) => {
        const value = _.get(object, key);
        if (value) {
          return `${key}=${value}`;
        }
      }),
    );
  }
  return _.compact(_.concat(_queryFilters(query.filters).join("&"), _queryParams(_.omit(query, "filters")))).join("&");
}

function waitForEntity(
  resolve: (value?: CFResource | PromiseLike<CFResource> | any) => void,
  reject: (reason?: any) => void,
  resource: CFResource,
  attempt: number,
  maxNumberOfAttemps: number,
  jobFunction: () => Promise<CFResource>,
  progress: ProgressHandler,
) {
  if (_.size(_.get(resource, "errors"))) {
    reject(new Error(messages.service_creation_failed(_.get(resource, ["errors", "0", "detail"]))));
    return;
  }

  if (attempt < maxNumberOfAttemps) {
    if (progress.cancelToken.isCancellationRequested) {
      reject(new Error(messages.create_service_canceled_by_requester));
      return;
    }

    const state = _.get(resource, "last_operation.state", ENTITY_STATE_INPROGRESS) as string;
    if (state === ENTITY_STATE_INPROGRESS) {
      progress.progress.report({
        message: `\n${messages.service_creation_started}`,
        increment: Math.floor((1 / maxNumberOfAttemps) * 100),
      });
      setTimeout(() => {
        jobFunction()
          .then((retriedResource) => {
            waitForEntity(resolve, reject, retriedResource, attempt + 1, maxNumberOfAttemps, jobFunction, progress);
          })
          .catch((error) => {
            reject(error);
          });
      }, 2000);
    } else if (state === ENTITY_STATE_FAILED) {
      reject(
        new Error(messages.failed_creating_entity(_.get(resource, "last_operation.description"), getName(resource))),
      );
    } else {
      progress.progress.report({ message: `\n${messages.service_creation_started}`, increment: 100 });
      resolve(resource);
    }
  } else {
    reject(new Error(messages.exceed_number_of_attempts(getName(resource))));
  }
}

async function execQuery(
  args: { query: string[]; options?: SpawnOptions; token?: CancellationToken },
  fncParse?: (arg: any) => Promise<any>,
  reverseErrorOrder?: boolean,
): Promise<any> {
  const cliResult: CliResult = await Cli.execute(args.query, args.options, args.token);
  if (cliResult.exitCode !== 0) {
    throw new Error(
      reverseErrorOrder
        ? cliResult.stdout || cliResult.stderr || cliResult.error
        : cliResult.error || cliResult.stderr || cliResult.stdout,
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return fncParse ? await fncParse(evaluateResponse(parse(cliResult.stdout))) : cliResult.stdout || cliResult.stderr;
}

async function execTotal(
  args: { query: string; options?: SpawnOptions; token?: CancellationToken },
  fncParse?: (resource: any, included: any) => Promise<any>,
): Promise<any[]> {
  const collection: any[] = [];
  let query = args.query;
  while (query) {
    const result = parse(
      await execQuery({ query: ["curl", await resolveEndpoint(query)], options: args.options, token: args.token }),
    );
    for (const resource of _.get(result, "resources", []) as any[]) {
      collection.push(fncParse ? await fncParse(resource, _.get(result, "included")) : resource);
    }
    query = _.get(result, ["pagination", "next", "href"]);
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return _.compact(collection);
}

/**
 * Fetch service instance by name from specified space_guid
 * @param query. Take care for encode the instance name in query parameter :  { key: eFilters.name, value: encodeURI(instanceName) }
 * @param token
 */
async function getServiceInstance(query: IServiceQuery, token?: CancellationToken): Promise<CFResource> {
  evaluateQueryFilters(query, resourceServiceInstances);
  query = await padQuerySpace(query, [{ key: eFilters.type, value: eServiceTypes.managed }]);
  const result = await execTotal({ query: `/v3/service_instances?${composeQuery(query)}`, token });
  if (_.size(result) >= 1) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return _.head(result);
  }
  throw new Error(
    messages.service_not_found(
      decodeURIComponent(_.get(_.find(query.filters, ["key", eFilters.names]), "value")) || "unknown",
    ),
  );
}

async function getUpsCredentials(instanceGuid: string, token?: CancellationToken): Promise<any> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return execQuery(
    { query: ["curl", `/v3/service_instances/${instanceGuid}/credentials`], token },
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    (data: any) => data,
  );
}

function resolveCfResource(data: CFResource, service: CFResource) {
  return _.merge(
    {
      name: getName(data),
      guid: getGuid(data),
      description: getDescription(data),
    },
    service
      ? {
          service_offering: {
            guid: getGuid(service),
            description: getDescription(service),
            name: getName(service),
          },
        }
      : {},
  );
}

function getCachedServicePlan(plan: any): Promise<CFResource> {
  if (!cacheServiceInstanceTypes[plan.guid]) {
    cacheServiceInstanceTypes[plan.guid] = execQuery(
      { query: ["curl", `/v3/service_plans/${plan.guid}?include=service_offering`] },
      (data: any) => {
        return Promise.resolve(
          resolveCfResource(
            data,
            _.find(_.get(data, ["included", "service_offerings"]), [
              "guid",
              _.get(data, ["relationships", "service_offering", "data", "guid"]),
            ]),
          ),
        );
      },
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return cacheServiceInstanceTypes[plan.guid];
}

function getServiceInstanceItem(item: any): Promise<any> {
  const planGuid = _.get(item, ["relationships", "service_plan", "data", "guid"]);
  return Promise.resolve({
    guid: getGuid(item),
    label: getName(item),
    tags: getTags(item),
    serviceName: isUpsType(item)
      ? Promise.resolve({ service_offering: { name: eServiceTypes.user_provided }, name: "" })
      : getCachedServicePlan({ guid: planGuid })
          .then((plan) => plan)
          .catch(() => {
            return {};
          }),
    plan_guid: planGuid,
    credentials: isUpsType(item)
      ? // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        getUpsCredentials(getGuid(item))
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          .then((data) => data)
          .catch(() => {
            return {};
          })
      : Promise.resolve(),
  });
}

async function resolveServiceInstances(results: any): Promise<ServiceInstanceInfo[]> {
  const queries = _.concat(_.map(results, "serviceName"), _.map(results, "credentials"));
  if (!_.size(queries)) {
    // sapjira issue DEVXBUGS-7773
    return [];
  }
  return Promise.all(queries).then(async () => {
    const instances: ServiceInstanceInfo[] = [];
    for (const result of results) {
      const serviceName = await _.get(result, "serviceName");
      instances.push({
        guid: getGuid(result),
        label: getLabel(result),
        serviceName: _.get(serviceName, ["service_offering", "name"], "unknown"),
        plan_guid: _.get(result, "plan_guid"),
        plan: _.get(serviceName, "name", "unknown"),
        tags: _.get(result, "tags"),
        credentials: await result.credentials,
      });
    }
    return _.compact(instances);
  });
}

/**
 * Returning User-provided-services instances
 *
 * @param query: IServiceQuery (optional)
 * @param token : CancellationToken (optional)
 */
export async function cfGetUpsInstances(
  query?: IServiceQuery,
  token?: CancellationToken,
): Promise<ServiceInstanceInfo[]> {
  evaluateQueryFilters(query, resourceServiceInstances);
  query = await padQuerySpace(query, [{ key: eFilters.type, value: eServiceTypes.user_provided }]);
  return resolveServiceInstances(
    await execTotal(
      { query: `/v3/service_instances?${composeQuery(query)}`, token },
      async (info: any): Promise<ServiceInstanceInfo> => getServiceInstanceItem(info),
    ),
  );
}

export async function cfCreateService(
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  planGuid: string,
  instanceName: string,
  params: any,
  tags: string[],
  progress?: ProgressHandler,
  maxNumberOfAttemps?: number,
): Promise<CFResource> {
  const spaceGuid: string = await getSpaceGuidThrowIfUndefined();
  maxNumberOfAttemps = _.isNil(maxNumberOfAttemps) ? 45 : maxNumberOfAttemps;
  progress = _.defaults(
    progress,
    { progress: { report: () => "" } },
    { cancelToken: { isCancellationRequested: false, onCancellationRequested: () => "" } },
  );
  const request = {
    type: eServiceTypes.managed,
    name: instanceName,
    relationships: {
      space: { data: { guid: spaceGuid } },
      service_plan: { data: { guid: planGuid } },
    },
    parameters: params,
    tags,
  };
  const result = await execQuery({
    query: ["curl", "/v3/service_instances", "-d", stringify(request), "-X", "POST"],
    token: progress.cancelToken,
  });

  progress.progress.report({ message: `\n${messages.service_creation_started}`, increment: 1 });

  const query = {
    filters: [
      { key: eFilters.names, value: encodeURIComponent(instanceName) },
      { key: eFilters.space_guids, value: spaceGuid },
    ],
  };
  return new Promise<CFResource>((resolve, reject) => {
    waitForEntity(
      resolve,
      reject,
      !_.isEmpty(_.replace(result, "\n", "")) ? parse(result) : result,
      0,
      maxNumberOfAttemps,
      () => getServiceInstance(query, progress.cancelToken),
      progress,
    );
  });
}

export async function cfCreateUpsInstance(info: UpsTypeInfo): Promise<CFResource> {
  let spaceGuid: string = info.space_guid;
  if (!spaceGuid) {
    spaceGuid = await getSpaceGuidThrowIfUndefined();
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return evaluateResponse(
    parse(
      await execQuery({
        query: [
          "curl",
          `/v3/service_instances`,
          "-d",
          stringify(
            _.merge(
              {
                name: info.instanceName,
                type: eServiceTypes.user_provided,
                relationships: { space: { data: { guid: spaceGuid } } },
              },
              info.credentials ? { credentials: info.credentials } : {},
              info.route_service_url ? { route_service_url: info.route_service_url } : {},
              info.syslog_drain_url ? { syslog_drain_url: info.syslog_drain_url } : {},
              info.tags ? { tags: info.tags } : {},
            ),
          ),
          "-X",
          "POST",
        ],
      }),
    ),
  );
}

export async function cfLogin(options: SSOLoginOptions | CredentialsLoginOptions): Promise<string> {
  let result;
  try {
    let query = ["login", "-a"];
    query =
      "ssoPasscode" in options
        ? _.concat(query, [
            options.endpoint,
            "--sso-passcode",
            options.ssoPasscode,
            "-o",
            "no-org-for-now",
            "-s",
            "no-space-for-now",
          ])
        : _.concat(query, [
            options.endpoint,
            "-u",
            options.user,
            "-p",
            options.password,
            "-o",
            "no-org-for-now",
            "-s",
            "no-space-for-now",
          ]);
    query = _.concat(query, options.origin ? ["--origin", options.origin] : []);
    result = await execQuery(
      {
        query,
        options: { env: { CF_COLOR: "false" } },
      },
      undefined,
      true,
    );
  } catch (e) {
    result = _.get(e, "message", "");
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return result.includes(`Authenticating...${NEW_LINE}${OK}`) ? OK : result;
}

export async function cfGetAvailableOrgs(query?: IServiceQuery): Promise<Organization[]> {
  evaluateQueryFilters(query, resourceOrganizations);
  const ret: Promise<Organization[]> = execTotal(
    { query: `/v3/organizations?${composeQuery(query)}` },
    (resource: any) => {
      return Promise.resolve({
        label: getName(resource),
        guid: getGuid(resource),
      });
    },
  );

  return ret;
}

export async function cfGetAvailableSpaces(orgGuid?: string): Promise<Space[]> {
  const query = ensureQuery();
  if (orgGuid) {
    _.merge(query.filters, [{ key: eFilters.organization_guids, value: orgGuid }]);
  }
  evaluateQueryFilters(query, resourceSpaces);
  const ret: Promise<Space[]> = execTotal({ query: `/v3/spaces?${composeQuery(query)}` }, (resource: any) => {
    return Promise.resolve({
      label: getName(resource),
      guid: getGuid(resource),
      orgGUID: getOrgGUID(resource),
    });
  });

  return ret;
}

function resolvePlanInfo(data: CFResource, service: CFResource) {
  return _.merge(
    {
      label: getName(data),
      guid: getGuid(data),
      description: getDescription(data),
    },
    service
      ? {
          service_offering: {
            guid: getGuid(service),
            description: getDescription(service),
            name: getName(service),
          },
        }
      : {},
  );
}

export async function cfGetServicePlansList(query?: IServiceQuery, token?: CancellationToken): Promise<PlanInfo[]> {
  query = await padQuerySpace(query, [{ key: eFilters.include, value: "service_offering" }]);
  evaluateQueryFilters(query, resourceServicePlan);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return execTotal({ query: `/v3/service_plans?${composeQuery(query)}`, token }, (data: any, included: any) => {
    return Promise.resolve(
      resolvePlanInfo(
        data,
        _.find(_.get(included, "service_offerings"), [
          "guid",
          _.get(data, ["relationships", "service_offering", "data", "guid"]),
        ]),
      ),
    );
  });
}

/**
 * @deprecated use cfGetManagedServiceInstances instead of
 * @param query
 * @param token (optional)
 */
export async function cfGetServiceInstances(
  query?: IServiceQuery,
  token?: CancellationToken,
): Promise<ServiceInstanceInfo[]> {
  query = await padQuerySpace(query, [
    { key: eFilters.service_plan, value: "guid,name", op: eOperation.fields },
    { key: eFilters.type, value: eServiceTypes.managed },
  ]);
  evaluateQueryFilters(query, resourceServiceInstances);
  return resolveServiceInstances(
    await execTotal(
      { query: `/v3/service_instances?${composeQuery(query)}`, token },
      (info: any): Promise<unknown> => getServiceInstanceItem(info),
    ),
  );
}

export async function cfGetManagedServiceInstances(
  query?: IServiceQuery,
  token?: CancellationToken,
): Promise<ServiceInstanceInfo[]> {
  return cfGetServiceInstances(query, token);
}

export async function cfSetOrgSpace(org: string, space?: string): Promise<void> {
  await execQuery({ query: _.concat(["target", "-o", org], space ? ["-s", space] : []) });
  clearCacheServiceInstances();
  void cfGetManagedServiceInstances();
}

export async function cfGetTargets(): Promise<CFTarget[]> {
  const targets = (await execQuery({ query: ["targets"] })) as string;

  if (_.includes(targets, "No targets have been saved yet") || _.includes(targets, "is not a registered command")) {
    // no targets yet.
    return [{ label: DEFAULT_TARGET, isCurrent: true, isDirty: false }];
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  const targetSubstrings = _.compact(_.map(targets.split(NEW_LINE), (targetSubstring) => targetSubstring.trim()));
  return _.map(targetSubstrings, (targetSubstring) => {
    const parentthesisPos = targetSubstring.indexOf("(current");
    if (parentthesisPos > 0) {
      targetSubstring = targetSubstring.substring(0, parentthesisPos);
      return { label: targetSubstring.trim(), isCurrent: true, isDirty: targetSubstring.includes("modified") };
    }

    return { label: targetSubstring, isCurrent: false, isDirty: false };
  });
}

export async function cfGetServices(
  query?: IServiceQuery,
  cancellationToken?: CancellationToken,
): Promise<ServiceInfo[]> {
  evaluateQueryFilters(query, resourceServiceOfferings);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return execTotal(
    { query: `/v3/service_offerings?${composeQuery(await padQuerySpace(query))}`, token: cancellationToken },
    (service: any) => {
      return Promise.resolve({
        label: getName(service),
        service_plans_url: _.get(service, ["links", "service_plans", "href"]),
        guid: getGuid(service),
        description: getDescription(service),
      });
    },
  );
}

/**
 * @deprecated backward compatibilty - > space guid is allowed filter for cfGetServices api
 * Returns the space services
 * @param query - Filter list
 * @param spaceGUID - Specific space. Undefined for the current space services.
 * @param cancellationToken - Token for canceling the operation
 */
export async function cfGetSpaceServices(
  query?: IServiceQuery,
  spaceGUID?: string,
  cancellationToken?: CancellationToken,
): Promise<ServiceInfo[]> {
  // Use filter functionality and exceptions to get the current space GUID.
  // We can access [0] because it is the only filter returned
  return cfGetServices(padQuery(query, [{ key: eFilters.space_guids, value: spaceGUID }]), cancellationToken);
}

/**
 * * Example of usage : cf bind-local -path .env -service-names serviceName1 serviceName2 -service-keys serviceKeys1 serviceKeys2 -tags tagsValue1 tagsValue2 -params {\"permissions\":[\"development\"]} -quote-vcap
 *
 * @param filePath : string
 * @param instanceNames : string[]
 * @param tags : string[] (Optional)
 * @param serviceKeyNames : string[] (Optional)
 * @param serviceKeyParams : any[] (Optional) Example: {"pemissions":["development"]}
 * @param quoteVcap : boolean (Optional) If true, it will surround the VCAP_SERVICES JSON object with single quotes
 */
export async function cfBindLocalServices(
  filePath: string,
  instanceNames: string[],
  tags?: string[],
  serviceKeyNames?: string[],
  serviceKeyParams?: unknown[],
  quoteVcap?: boolean,
): Promise<void> {
  await execQuery({
    query: [
      "bind-local",
      "-path",
      filePath,
      "-service-names",
      ...instanceNames,
      ...(_.size(tags) ? _.concat(["-tags"], tags) : []),
      ...(_.size(serviceKeyNames) ? _.concat(["-service-keys"], serviceKeyNames) : []),
      ...(_.size(serviceKeyParams)
        ? _.concat(
            ["-params"],
            _.map(serviceKeyParams, (param) => {
              return stringify(param);
            }),
          )
        : []),
      ...(quoteVcap ? ["-quote-vcap"] : []),
    ],
  });
}

/**
 * Example of usage : cf bind-local-ups -path .env -service-names serviceNamesValue1 -service-names serviceNamesvalue2 -tags tagsValue1 -tags tagsValue2 -quote-vcap
 *
 * @param filePath : string
 * @param instanceNames : string[]
 * @param tags : string[] (Optional)
 * @param quoteVcap : boolean (Optional) If true, it will surround the VCAP_SERVICES JSON object with single quotes
 */
export async function cfBindLocalUps(
  filePath: string,
  instanceNames: string[],
  tags?: string[],
  quoteVcap?: boolean,
): Promise<void> {
  await execQuery({
    query: _.concat(
      ["bind-local-ups", "-path", filePath],
      _.reduce(
        instanceNames,
        (result, instanceName) => {
          result = _.concat(result, [`-service-names`, `${instanceName}`]);
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return result;
        },
        [],
      ),
      _.reduce(
        tags,
        (result, tag) => {
          result = _.concat(result, [`-tags`, `${tag}`]);
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return result;
        },
        [],
      ),
      quoteVcap ? ["-quote-vcap"] : [],
    ),
  });
}

export async function cfGetInstanceMetadata(instanceName: string): Promise<any> {
  const result = await cfGetServiceInstances(
    await padQuerySpace({
      filters: [
        { key: eFilters.names, value: encodeURIComponent(instanceName) },
        { key: eFilters.type, value: eServiceTypes.managed },
      ],
    }),
  );
  if (!_.size(result)) {
    throw new Error(messages.service_not_found(instanceName));
  }
  const serviceInstance = _.head(result);
  return {
    serviceName: getLabel(serviceInstance),
    plan: _.get(serviceInstance, "plan"),
    plan_guid: _.get(serviceInstance, "plan_guid"),
    service: _.get(serviceInstance, "serviceName"),
  };
}

export async function cfGetAuthToken(): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return await execQuery({ query: ["oauth-token"] });
}

export async function cfGetTarget(weak?: boolean): Promise<ITarget> {
  if (!weak) {
    await cfGetAuthToken();
  }
  return parseRawDictData(await execQuery({ query: ["target"], options: { env: { CF_COLOR: "false" } } })) as ITarget;
}

export async function cfGetServicePlans(servicePlansUrl: string): Promise<PlanInfo[]> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return execTotal({ query: servicePlansUrl }, (data: any) => {
    return Promise.resolve({ label: getName(data), guid: getGuid(data), description: getDescription(data) });
  });
}

export async function cfLogout(): Promise<void> {
  await execQuery({ query: ["logout"] });
}

export async function cfGetServiceKeys(query?: IServiceQuery, token?: CancellationToken): Promise<CFResource[]> {
  evaluateQueryFilters(query, resourceServiceCredentialsBinding);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return execTotal({
    query: `/v3/service_credential_bindings?${composeQuery(padQuery(query, [{ key: eFilters.type, value: "key" }]))}`,
    token,
  });
}

export async function cfGetInstanceCredentials(query?: IServiceQuery, token?: CancellationToken): Promise<any[]> {
  const results: any[] = _.map(await cfGetServiceKeys(query, token), (resource: any) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return (
      execQuery(
        { query: ["curl", `/v3/service_credential_bindings/${getGuid(resource)}/details`], token },
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        (data: any) => data,
      )
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        .then((data) => data)
        .catch(() => {
          return {};
        })
    );
  });
  return Promise.all(_.compact(results));
}

export async function cfGetInstanceKeyParameters(instanceName: string): Promise<any | undefined> {
  const instance = await getServiceInstance({
    filters: [{ key: eFilters.names, value: encodeURIComponent(instanceName) }],
  });
  const query = { filters: [{ key: eFilters.service_instance_guids, value: getGuid(instance) }] };
  let keys = await cfGetServiceKeys(query);
  if (!_.size(keys)) {
    await Cli.execute(["create-service-key", encodeURIComponent(instanceName), "key", "--wait"]);
    keys = await cfGetServiceKeys(padQuery(query, [{ key: eFilters.names, value: "key" }]));
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return (
    execQuery(
      { query: ["curl", `/v3/service_credential_bindings/${getGuid(_.head(keys))}/details`] },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      (data: any) => data,
    )
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      .then((data) => data)
      .catch(() => {
        return {};
      })
  );
}

export async function cfGetServiceInstancesList(
  query?: IServiceQuery,
  token?: CancellationToken,
): Promise<ServiceInstanceInfo[]> {
  query = await padQuerySpace(query, [{ key: eFilters.service_plan, value: "guid,name", op: eOperation.fields }]);
  evaluateQueryFilters(query, resourceServiceInstances);
  return resolveServiceInstances(
    await execTotal(
      { query: `/v3/service_instances?${composeQuery(query)}`, token },
      (info: any): Promise<unknown> => getServiceInstanceItem(info),
    ),
  );
}

export async function cfGetApps(query?: IServiceQuery, token?: CancellationToken): Promise<any> {
  evaluateQueryFilters(query, resourceApps);
  return execTotal({ query: `/v3/apps?${composeQuery(await padQuerySpace(query))}`, token });
}

/**
 *  Set or view target api url
 * @param params.url: string. When specified is used for set
 * @param params.skip_ssl_validation: boolean. Skip verification of the API endpoint. Not recommended!
 * @param params.unset: boolean. Remove all api endpoint targeting
 * @returns
 */
export async function cfApi(params?: { url?: string; skip_ssl_validation?: boolean; unset?: boolean }): Promise<Api> {
  const query = ["api"];
  if (params?.url) {
    query.push(params.url);
  }
  if (params?.skip_ssl_validation) {
    query.push("--skip-ssl-validation");
  }
  if (params?.unset) {
    query.push("--unset");
  }
  return parseRawDictData(await execQuery({ query: [...query] })) as Api;
}
