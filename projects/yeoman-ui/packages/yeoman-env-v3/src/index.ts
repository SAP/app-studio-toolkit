const YeomanEnvironment = require("yeoman-environment") as any;

export interface LegacyEnv {
  register(resolved: string, namespace: string): void;
  create(namespace: string, options: { options: any }): any;
  runGenerator(gen: any): Promise<void>;
  lookup(options?: any): any;
  runLoop: any;
  adapter: any;
  sharedFs: any;
  on(event: string, cb: (...args: any[]) => void): unknown;
  emit(event: string, ...args: any[]): boolean;
  removeAllListeners(event?: string): unknown;
}

export const createEnv: (
  args?: string[],
  opts?: Record<string, unknown>,
  adapter?: any
) => LegacyEnv = YeomanEnvironment.createEnv ?? YeomanEnvironment;
