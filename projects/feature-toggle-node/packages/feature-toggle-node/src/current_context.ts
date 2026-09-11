import { getEnv, getEnvWithError } from "./utils";

const USER_NAME = "USER_NAME";
const LANDSCAPE_ENVIRONMENT = "LANDSCAPE_ENVIRONMENT";
const LANDSCAPE_NAME = "LANDSCAPE_NAME";
const TENANT_ID = "TENANT_ID";
const SUB_ACCOUNT = "TENANT_NAME";
const WORKSPACE_ID = "WORKSPACE_ID";
const LANDSCAPE_INFRASTRUCTURE = "LANDSCAPE_INFRASTRUCTURE";

export type ContextData = {
  environment: string;
  infrastructure: string;
  landscape: string;
  subaccount: string;
  user: string;
  ws: string;
  tenantid: string;
};

function getEnvWithNotFoundError(envVar: string): string {
  return getEnvWithError(envVar, `Feature toggle env ${envVar} was NOT found in the environment variables`);
}

export function createContextEntity(): ContextData {
  // get the user name from the env
  const user = getEnv(USER_NAME);
  // get the environment from the env
  const environment = getEnvWithNotFoundError(LANDSCAPE_ENVIRONMENT);
  // get the landscape from the env
  const landscape = getEnvWithNotFoundError(LANDSCAPE_NAME);
  // get the tenant id from the env
  const tenantid = getEnv(TENANT_ID);
  // get the tenant id from the env
  const subaccount = getEnv(SUB_ACCOUNT);
  // get WORKSPACE_ID env
  const ws = getEnvWithNotFoundError(WORKSPACE_ID);
  // get LANDSCAPE_INFRASTRUCTURE env or empty string if not found
  const infrastructure = getEnv(LANDSCAPE_INFRASTRUCTURE);

  // Create the context
  return {
    environment,
    infrastructure,
    landscape,
    subaccount,
    user,
    ws,
    tenantid,
  };
}
