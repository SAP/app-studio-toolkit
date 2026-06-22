const YeomanEnvironment = require("yeoman-environment") as any;

export const createEnv: (
  args?: string[],
  opts?: Record<string, unknown>,
  adapter?: any
) => {
  register(resolved: string, namespace: string): void;
  create(namespace: string, options: { options: any }): any;
  runLoop: object;
  adapter: object;
  sharedFs: object;
} = YeomanEnvironment.createEnv ?? YeomanEnvironment;
