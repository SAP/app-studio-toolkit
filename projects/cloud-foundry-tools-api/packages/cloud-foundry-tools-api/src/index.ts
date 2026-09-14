export * from "./types";
export * from "./cli";
export * from "./cf-local";
export * from "./messages";
export * from "./utils";

import { ServiceInstanceInfo } from "./types";
import * as serviceUtils from "./cfServicesUtil";

export async function apiGetServicesInstancesFilteredByType(serviceTypes: string[]): Promise<ServiceInstanceInfo[]> {
  return serviceUtils.getServicesInstancesFilteredByType(serviceTypes);
}

/**
 * @deprecated use cfGetInstanceKeyParameters instead of
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function apiGetInstanceCredentials(instanceName: string): Promise<any> {
  return serviceUtils.getInstanceCredentials(instanceName);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function apiCreateServiceInstance(
  serviceType: string,
  servicePlan: string,
  instanceName: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  config?: any,
) {
  return serviceUtils.createServiceInstance(serviceType, servicePlan, instanceName, config);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function apiGetInstanceMetadata(instanceName: string): Promise<any> {
  return serviceUtils.getInstanceMetadata(instanceName);
}
