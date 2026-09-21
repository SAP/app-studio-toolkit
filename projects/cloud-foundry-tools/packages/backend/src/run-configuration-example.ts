import * as vscode from "vscode";
import * as path from "path";
import {
  IRunnable,
  IRunConfigContext,
  IDependencyContext,
  ConfigurationTarget,
  IRunConfigHandler,
  IConfigurationData,
  ConfigObject,
} from "@sap/wing-run-config-types";

class Runnable implements IRunnable {
  public displayName = "CF Tools Example";
  public displayType = "CF Tools Type";
  public path = "path";
  constructor(public id: string) {}
}

class DependencyContext implements IDependencyContext {
  public displayName = "cf-tools-rsource-dependency";
  public bindable = true;
  public displayType = "cf-tools-rsource-dependency";
  public type = "hana";
  public dependencyHandlerId = "cf-tools-rsource-dependency";
}

export class RunConfigContext implements IRunConfigContext {
  public iconBuffer: Buffer;
  public displayName = "CF Tools Example";
  public groupName = this.appId;
  public envPath: vscode.Uri = vscode.Uri.file(
    path.join("C:", "Users", "your-i-number", "devx-wing", "test-run-config", "env", ".env")
  );
  public path: vscode.Uri;
  public dependencies = [new DependencyContext()];

  constructor(private readonly id: string, private readonly appId: string) {
    this.groupName = appId;
    this.path = vscode.Uri.file("");
    this.iconBuffer = Buffer.alloc(1);
  }
}

export class RunConfigHandler implements IRunConfigHandler {
  constructor(private readonly id: string) {}

  public getRunnables(): Promise<IRunnable[]> {
    return Promise.resolve([
      new Runnable(this.id),
      // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
      new Runnable(this.id + 1),
      // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
      new Runnable(this.id + 2),
    ]);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public getRunConfigContext(runnableId: string, confData: IConfigurationData): Promise<IRunConfigContext> {
    return Promise.resolve(new RunConfigContext(this.id, "Cf App"));
  }

  public createConfiguration(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    runnableId: string
  ): Promise<IConfigurationData> {
    return Promise.resolve({
      config: new ConfigObject(
        {
          type: "node",
          request: "launch",
          // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
          name: "cf run " + Date.now(),
          env: {
            Saggi: 1,
            "run.config": "sage",
          },
        },
        ConfigurationTarget.launch
      ),
    });
  }

  public getId(): string {
    return "cf_run_id_" + this.id;
  }
}
