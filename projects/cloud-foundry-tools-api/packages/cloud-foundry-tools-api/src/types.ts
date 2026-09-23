/* eslint-disable @typescript-eslint/no-explicit-any */
export const OK = "OK";
export const NEW_LINE = "\n";

export const CF_PAGE_SIZE = 99 * 3;
export const DEFAULT_TARGET = "Default (no targets)";

export interface CliResult {
  stdout: string;
  stderr: string;
  error?: string;
  exitCode: number;
}

export enum CF_CMD_EXIT_CODE {
  OK = 0,
  ERROR = -1,
  CANCEL_REQ = -2,
  CANCELED = -3,
}

export interface CancellationToken {
  /**
   * Is `true` when the token has been cancelled, `false` otherwise.
   */
  isCancellationRequested: boolean;
  /**
   * An [event](#Event) which fires upon cancellation.
   */
  onCancellationRequested: any;
}

interface Progress<T> {
  /**
   * Report a progress update.
   * @param value A progress item, like a message and/or an
   * report on how much work finished
   */
  report(value: T): void;
}

export interface ProgressHandler {
  progress: Progress<{ message?: string; increment?: number }>;
  cancelToken: CancellationToken;
}

export interface CFTarget {
  label: string;
  isCurrent: boolean;
  isDirty: boolean;
}

export interface ServiceInstanceInfo {
  label: string;
  serviceName: string;
  guid?: string;
  tags?: string[];
  alwaysShow?: boolean;
  plan_guid?: string;
  plan?: string;
  credentials?: any;
}

export interface ServiceInfo {
  label: string;
  guid: string;
  service_plans_url: string;
  description: string;
}

export interface PlanInfo {
  label: string;
  guid: string;
  description: string;
  service_offering?: {
    guid: string;
    name: string;
    description: string;
  };
}

export interface CFResource {
  guid: string;
  name: string;
  description: string;
  schemas: any;
  relationships: any;
  metadata: any;
  links: any;
}

export interface ServiceTypeInfo {
  name: string; // uses to filter the display of instances by service type: 'hana', 'xsuaa' and etc. (Regex)
  plan: string; // uses to filter the display of instances by plan name: 'application', 'lite' and etc. can be single name or regex expression (Regex)
  tag: string; // tag attribute name that will glued for service instance in .env (not relevant for ups)
  prompt: string; // displaying prompt title on select service instances quick pick
  plans?: PlanInfo[]; // internal
  serviceKeyName?: string; // service key attribute name that will glued for service instance in .env (not relevant for ups)
  serviceKeyParam?: any; // arbitrary params in json format to be glued to service-key during 'bind-local'
  ups?: {
    // user-provided-services section
    tag?: string; // uses to filter the display of user-provided-services by tag. can be sigle name or regex expression ('/[hana|monodb]/')
    isShow?: boolean; // force to fetch ups instances
  };
  allowCreate?: {
    // allow creation a new service instance during binding
    serviceName?: string; // uses to filter the display of service instance creation (Regex). instances by service type: 'hana', 'xsuaa' and etc.
    plan?: string; // plan for the created service instance (Regex)
    tag?: string; // tag attribute name that will glued for service instance in .env (not relevant for ups)
    name?: string; // default allocated name for creating service instance
    namePrompt?: string; // prompt for service instance name creation quik pick
    getParams?: () => Promise<any>; // arbitrary async params getter in json format for service instance creation.
  };
}

export enum eFilters {
  type = "type",
  names = "names",
  guids = "guids",
  app_guids = "app_guids",
  app_names = "app_names",
  space_guids = "space_guids",
  available = "available",
  broker_catalog_ids = "broker_catalog_ids",
  service_broker_guids = "service_broker_guids",
  service_broker_names = "service_broker_names",
  service_plan_guids = "service_plan_guids",
  organization_guids = "organization_guids",
  service_plan_names = "service_plan_names",
  service_plan = "service_plan",
  service_instance_guids = "service_instance_guids",
  service_instance_names = "service_instance_names",
  service_offering_guids = "service_offering_guids",
  service_offering_names = "service_offering_names",
  label_selector = "label_selector",
  page = "page",
  per_page = "per_page",
  oder_by = "order_by",
  created_ats = "created_ats",
  updated_ats = "updated_ats",
  status = "status",
  // label = 'label',
  include = "include",
}

export enum eOperation {
  gte = "gte",
  lte = "lte",
  lt = "lt",
  gt = "gt",
  not = "not",
  fields = "fields",
}
export interface IServiceFilters {
  key: eFilters;
  value: string;
  op?: eOperation;
}

export enum eOrderDirection {
  asc,
  desc,
}
export enum eServiceTypes {
  managed = "managed",
  user_provided = "user-provided",
}

export interface IServiceQuery {
  filters?: IServiceFilters[];
  per_page?: number; // number of results per page : valid values are 1 through 5000
  page?: number;
  order_by?: eOrderDirection;
}

export interface ServiceBinding {
  env: string;
  id: string;
  type: string;
  version: string;
}

export interface UAAInfo {
  apiurl: string;
  clientid: string;
  clientsecret: string;
  identityzone: string;
  identityzoneid: string;
  sburl: string;
  tenantid: string;
  tenantmode: string;
  uaadomain: string;
  url: string;
  verificationkey: string;
  xsappname: string;
}

export interface ServiceKey {
  binding: ServiceBinding;
  catalogs: any;
  endpoints: any;
  preserve_host_header: boolean;
  "sap.cloud.service": string;
  systemid: string;
  uaa: UAAInfo;
  url: string;
}

export interface Api {
  "api endpoint": string;
  "api version": string;
}

export interface ITarget extends Api {
  user: string;
  org?: string;
  space?: string;
}

export interface UpsTypeInfo {
  instanceName: string;
  space_guid?: string;
  syslog_drain_url?: string;
  credentials?: unknown;
  route_service_url?: string;
  tags?: string[];
}

interface LoginOptions {
  endpoint: string;
  origin?: string;
}

export interface SSOLoginOptions extends LoginOptions {
  ssoPasscode: string;
}

export interface CredentialsLoginOptions extends LoginOptions {
  user: string;
  password: string;
}

export interface Organization {
  label: string;
  guid: string;
}

export interface Space {
  label: string;
  guid: string;
  orgGUID: string;
}
