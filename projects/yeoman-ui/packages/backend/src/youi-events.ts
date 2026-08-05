import { AppWizard } from "@sap-devx/yeoman-ui-types";

export interface YouiEvents {
  doGeneratorDone(
    success: boolean,
    message: string,
    selectedWorkspace: string,
    type: string,
    targetFolderPath?: string
  ): Thenable<any>;
  doGeneratorProgress(
    projectName: string | undefined,
    phase: "writing" | "install" | "end",
    showProgress?: boolean
  ): Promise<void>;
  showProgress(message?: string): void;
  getAppWizard(): AppWizard;
  executeCommand(id: string, ...args: any[]): Thenable<any>;
  setAppWizardHeaderTitle(title: string, info?: string): void;
}
