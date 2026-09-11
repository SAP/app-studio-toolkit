import { log } from "./logger";

function throwError(errorMessage: string): void {
  throw new Error(`[ERROR] ${errorMessage}`);
}

export function getEnv(envName: string): string {
  let envValue = process.env[envName];

  if (envValue) {
    envValue = envValue.trim().toLowerCase();
    log(`${envName} from env is: ${envValue}`);
  }

  return envValue ?? "";
}

export function getEnvWithError(envName: string, errorMessage: string): string {
  const envValue = getEnv(envName);

  if (!envValue.length) {
    throwError(errorMessage);
  }

  return envValue;
}

export function convertPluralNameToSingular(param: string): string {
  return param.slice(0, param.length - 1);
}
