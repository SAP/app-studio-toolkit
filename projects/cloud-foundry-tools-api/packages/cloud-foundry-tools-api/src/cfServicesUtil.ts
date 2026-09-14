/* eslint-disable @typescript-eslint/no-explicit-any */
import { Cli } from "./cli";
import * as _ from "lodash";
import { eFilters, ServiceInstanceInfo } from "./types";
import {
  cfGetInstanceMetadata,
  cfGetTarget,
  cfGetInstanceKeyParameters,
  cfGetManagedServiceInstances,
  cfGetServicePlansList,
} from "./cf-local";

export async function getServicesInstancesFilteredByType(serviceTypes: string[]): Promise<ServiceInstanceInfo[]> {
  const guids = _.map(
    await cfGetServicePlansList({
      filters: [{ key: eFilters.service_offering_names, value: _.join(_.map(serviceTypes, encodeURIComponent)) }],
    }),
    "guid",
  );
  return _.size(guids)
    ? cfGetManagedServiceInstances({ filters: [{ key: eFilters.service_plan_guids, value: _.join(guids) }] })
    : [];
}

/**
 * @deprecated use cfGetInstanceKeyParameters instead of
 */
export function getInstanceCredentials(instanceName: string): Promise<any> {
  return cfGetInstanceKeyParameters(instanceName);
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function createServiceInstance(
  serviceType: string,
  servicePlan: string,
  serviceInstanceName: string,
  config?: any,
  nowait?: boolean,
): Promise<any> {
  let args = ["create-service", serviceType, servicePlan, serviceInstanceName];
  if (config) {
    args = args.concat(["-c", config]);
  }
  if (nowait !== true) {
    args.push("--wait");
  }
  return Cli.execute(args);
}

/**
 * @deprecated : use cfGetInstanceMetadata instead of
 */
export function getInstanceMetadata(instanceName: string): Promise<any> {
  return cfGetInstanceMetadata(instanceName);
}

export async function isTargetSet(): Promise<boolean> {
  const target = await cfGetTarget();
  return !_.isEmpty(target.org) && !_.isEmpty(target.space);
}
