"use strict";

// yeoman-environment v3 and yeoman-generator v4 ship no TypeScript declarations,
// so we use `any` for their module shapes and expose typed wrappers.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const YeomanEnvironment = require("yeoman-environment") as any;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const YeomanGenerator = require("yeoman-generator") as any;

// yeoman-environment v3: the default export is the Environment class itself.
// createEnv is a static factory on it.
export type CompatEnvironment = {
  register(resolved: string, namespace: string): void;
  create(namespace: string, options: { options: any }): any;
  runLoop: object;
  adapter: object;
  sharedFs: object;
};

export type CreateEnvFn = (
  args?: string[],
  opts?: Record<string, unknown>,
  adapter?: any
) => CompatEnvironment;

export const createEnv: CreateEnvFn =
  YeomanEnvironment.createEnv ?? YeomanEnvironment;

export { YeomanEnvironment, YeomanGenerator };
