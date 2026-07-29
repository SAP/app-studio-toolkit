import type { Uri, WebviewPanel } from "vscode";
import { vscode } from "./utils/vscodeProxy.js";
import lodash from "lodash";
import { YouiEvents } from "./youi-events.js";
import type { IRpc } from "@sap-devx/webview-rpc/out.ext/rpc-common.js";
import { GeneratorOutput } from "./vscode-output.js";
import type { IChildLogger } from "@vscode-logging/logger";
import { getClassLogger } from "./logger/logger-wrapper.js";
import { getImage } from "./images/messageImages.js";
import {
  AppWizard,
  MessageType,
  Severity,
  IBannerProps,
} from "@sap-devx/yeoman-ui-types";
import {
  FolderUriConfig,
  getFolderUri,
  getValidFolderUri,
  WorkspaceFile,
  WsFoldersToAdd,
} from "./utils/workspaceFile.js";
import { Constants } from "./utils/constants.js";
import { getFileSchemeWorkspaceFolders } from "./utils/workspaceFolders.js";

const { isEmpty, isNil, set } = lodash;

// App Wizard wrapper that delegates to VSCodeYouiEvents
class YoUiAppWizard extends AppWizard {
  constructor(private readonly events: VSCodeYouiEvents) {
    super();
  }

  public showError(message: string, type: MessageType): void {
    this.events.showMessage(message, Severity.error, type);
  }

  public showWarning(message: string, type: MessageType): void {
    this.events.showMessage(message, Severity.warning, type);
  }

  public showInformation(message: string, type: MessageType): void {
    this.events.showMessage(message, Severity.information, type);
  }

  public showProgress(message?: string): void {
    this.events.showProgress(message);
  }

  // Allows generators to update the App Wizard title
  public setHeaderTitle(title: string, additionalInfo?: string): void {
    this.events.setAppWizardHeaderTitle(title, additionalInfo);
  }

  public setBanner(bannerProps: IBannerProps): void {
    this.events.setAppWizardBanner(bannerProps);
  }
}

export class VSCodeYouiEvents implements YouiEvents {
  private readonly rpc: IRpc;
  private webviewPanel: WebviewPanel;
  private readonly messages: any;
  private resolveFunc: any;
  private progressReporter: any; // Store progress reporter to update it
  private currentProjectName: string | undefined; // Store project name for success message
  public output: GeneratorOutput;
  private readonly logger: IChildLogger;
  private readonly appWizard: AppWizard;

  constructor(
    rpc: IRpc,
    webviewPanel: WebviewPanel,
    messages: any,
    output: GeneratorOutput
  ) {
    this.rpc = rpc;
    this.webviewPanel = webviewPanel;
    this.messages = messages;
    this.output = output;
    this.logger = getClassLogger("VSCodeYouiEvents");
    this.appWizard = new YoUiAppWizard(this);
  }

  public setAppWizardHeaderTitle(title: string, additionalInfo?: string): void {
    void this.rpc.invoke("setHeaderTitle", [title, additionalInfo]);
  }

  public setAppWizardBanner(bannerProps: IBannerProps): void {
    // This method allows generators to update the App Wizard banner
    void this.rpc.invoke("setBanner", [bannerProps]);
  }

  public doGeneratorDone(
    success: boolean,
    message: string,
    selectedWorkspace: string,
    type: string,
    targetFolderPath?: string
  ): Promise<void> {
    // Show "Finalising..." before closing
    if (this.progressReporter) {
      this.progressReporter.report({ message: "Finalising..." });
    }

    // Hold the "Finalising..." message briefly before closing notification
    return new Promise((resolve) => {
      setTimeout(async () => {
        this.resolveInstallingProgress();
        set(this.webviewPanel, Constants.GENERATOR_COMPLETED, success);
        this.doClose();
        await this.showDoneMessage(
          success,
          message,
          selectedWorkspace,
          type,
          targetFolderPath,
          true // Skip resolving progress since we already did it
        );
        resolve();
      }, 100);
    });
  }

  public doGeneratorInstall(projectName?: string): void {
    this.doClose();
    this.showInstallMessage(projectName);
  }

  public async doGeneratorProgress(
    projectName: string | undefined,
    phase: "writing" | "install" | "end"
  ): Promise<void> {
    // Map phases to user-friendly messages
    const phaseMessages = {
      writing: "Creating project files...",
      install: "Installing dependencies...",
      end: "Finalising...",
    };

    const message = phaseMessages[phase];

    // If this is the first phase (writing), initialize the notification with the message
    if (phase === "writing") {
      this.doClose();
      this.showInstallMessage(projectName, message);

      // Wait for the progress reporter to be initialized
      await new Promise((resolve) => setTimeout(resolve, 50));
    } else {
      if (this.progressReporter) {
        // Artificial delay for "install" phase to ensure "Creating project files..." is visible for 2 seconds
        if (phase === "install") {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }

        // Give VS Code time to render the previous state before updating
        await new Promise((resolve) => setTimeout(resolve, 10));
        // Don't use increment to get a continuous spinner instead of a stuck progress bar
        this.progressReporter.report({ message });
      }
    }
  }

  public getAppWizard(): AppWizard {
    return this.appWizard;
  }

  public executeCommand(id: string, args: any[]): Thenable<any> {
    return vscode.commands.executeCommand(id, ...args);
  }

  private getMessageImage(state: Severity): any {
    return getImage(state);
  }

  private showPromptMessage(message: string, state: Severity) {
    const image = this.getMessageImage(state);
    void this.rpc.invoke("showPromptMessage", [`${message}`, state, image]);
  }

  private showNotificationMessage(message: string, state: Severity) {
    switch (state) {
      case Severity.error:
        return vscode.window.showErrorMessage(message);
      case Severity.warning:
        return vscode.window.showWarningMessage(message);
      default:
        return vscode.window.showInformationMessage(message); // Severity.information
    }
  }

  public showMessage(message = "", state: Severity, type: MessageType) {
    message = `${message}`;
    this.output.appendLine(message);
    if (type === MessageType.notification) {
      void this.showNotificationMessage(message, state);
    } else {
      // prompt
      this.showPromptMessage(message, state);
    }
  }

  public showProgress(message?: string): void {
    const openOutput: any = this.messages.show_progress_button;
    const buttons: string[] = [];
    buttons.push(openOutput);
    if (isEmpty(message)) {
      message = this.messages.show_progress_message;
    }
    this.output.appendLine(message);
    this.logger.debug("Showing Progress.", {
      notificationMessage: message,
    });
    void vscode.window
      .showInformationMessage(message, ...buttons)
      .then((selection) => {
        if (selection === openOutput) {
          return this.toggleOutput();
        }
      });
  }

  private toggleOutput() {
    this.output.show();
    this.logger.trace("Output was shown.");
  }

  private doClose(): void {
    if (this.webviewPanel) {
      this.webviewPanel.dispose();
      this.webviewPanel = null;
    }
  }

  private showInstallMessage(
    projectName?: string,
    initialMessage: string = "Preparing..."
  ): void {
    // Store project name for later use in success message
    this.currentProjectName = projectName;

    // Use "Generating {projectName}" as the title
    const title = projectName
      ? `Generating ${projectName}`
      : "Application Generator";

    void vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: title,
        cancellable: false,
      },
      async (progress) => {
        // Store the progress reporter so we can update it
        this.progressReporter = progress;
        progress.report({ message: initialMessage });

        // Keep the notification open until generation completes
        await new Promise((resolve) => {
          this.resolveFunc = resolve;
        });

        // Clean up the progress reporter
        this.progressReporter = null;
      }
    );
  }

  private resolveInstallingProgress() {
    if (this.resolveFunc) {
      this.resolveFunc();
    }
  }

  private showDoneMessage(
    success: boolean,
    errorMmessage: string,
    selectedWorkspace: string,
    type: string,
    targetFolderPath?: string,
    skipResolve: boolean = false
  ): Thenable<any> {
    if (!skipResolve) {
      this.resolveInstallingProgress();
    }

    if (success) {
      if (!isNil(targetFolderPath)) {
        const folderUri = getFolderUri(targetFolderPath);
        if (folderUri) {
          const folderUriConfig: FolderUriConfig = getValidFolderUri(folderUri);
          this.addToWorkspaceUriFlow(selectedWorkspace, folderUriConfig);
        } else {
          this.addToWorkspacePathFlow(targetFolderPath, selectedWorkspace);
        }
      }
      const successInfoMessage = this.getSuccessInfoMessage(
        selectedWorkspace,
        type
      );
      return successInfoMessage // show the message only if it is not empty
        ? vscode.window.showInformationMessage(successInfoMessage)
        : Promise.resolve();
    }

    return vscode.window.showErrorMessage(errorMmessage);
  }

  private addToWorkspacePathFlow(
    targetFolderPath: string,
    selectedWorkspace: string
  ) {
    const targetFolderUri: Uri = vscode.Uri.file(targetFolderPath);
    if (selectedWorkspace === this.messages.open_in_a_new_workspace) {
      void vscode.commands.executeCommand("vscode.openFolder", targetFolderUri);
    } else if (selectedWorkspace === this.messages.add_to_workspace) {
      const wsFoldersToAdd: WsFoldersToAdd = {
        uri: targetFolderUri,
      };
      this.addOrCreateProjectWorkspace(wsFoldersToAdd);
      if (isNil(vscode.workspace.workspaceFile)) {
        const workspaceFileUri =
          WorkspaceFile.createWsWithPath(targetFolderUri);
        void vscode.commands.executeCommand(
          "vscode.openFolder",
          workspaceFileUri
        );
      }
    }
  }

  private addToWorkspaceUriFlow(
    selectedWorkspace: string,
    folderUriConfig: FolderUriConfig
  ) {
    if (selectedWorkspace === this.messages.open_in_a_new_workspace) {
      const workspaceFileUri = WorkspaceFile.createWsWithUri(folderUriConfig);
      void vscode.commands.executeCommand(
        "vscode.openFolder",
        workspaceFileUri
      );
    } else if (selectedWorkspace === this.messages.add_to_workspace) {
      const targetFolderUri = vscode.Uri.parse(folderUriConfig.uri);
      const uniqueProjectName = this.getUniqueProjectName(folderUriConfig.name);
      const wsFoldersToAdd: WsFoldersToAdd = {
        uri: targetFolderUri,
        name: uniqueProjectName,
      };
      this.addOrCreateProjectWorkspace(wsFoldersToAdd);
      if (isNil(vscode.workspace.workspaceFile)) {
        const workspaceFileUri = WorkspaceFile.createWsWithUri(folderUriConfig);
        void vscode.commands.executeCommand(
          "vscode.openFolder",
          workspaceFileUri
        );
      }
    } else {
      WorkspaceFile.createWsWithUri(folderUriConfig);
    }
  }

  private getUniqueProjectName(baseName: string): string {
    const existingNames = getFileSchemeWorkspaceFolders().map(
      (folder) => folder.name
    );
    if (!existingNames.includes(baseName)) {
      return baseName;
    }

    let counter = 1;
    let uniqueName = `${baseName}(${counter})`;

    while (existingNames.includes(uniqueName)) {
      counter++;
      uniqueName = `${baseName}(${counter})`;
    }

    return uniqueName;
  }

  private addOrCreateProjectWorkspace(wsFoldersToAdd: WsFoldersToAdd) {
    const fileSchemeWorkspaces = getFileSchemeWorkspaceFolders();
    const insertPosition = fileSchemeWorkspaces.length;
    vscode.workspace.updateWorkspaceFolders(
      insertPosition,
      null,
      wsFoldersToAdd
    );
  }

  private getSuccessInfoMessage(
    selectedWorkspace: string,
    type: string
  ): string {
    // Default message with project name if available
    let successInfoMessage: string = this.currentProjectName
      ? `Project ${this.currentProjectName} has been generated.`
      : this.messages.artifact_generated_files;

    if (type === "project") {
      // For project type, use project name and add workspace-specific detail
      if (this.currentProjectName) {
        if (selectedWorkspace === this.messages.open_in_a_new_workspace) {
          successInfoMessage = `Project ${this.currentProjectName} has been generated. The project will be opened in a new workspace.`;
        } else if (selectedWorkspace === this.messages.add_to_workspace) {
          successInfoMessage = `Project ${this.currentProjectName} has been generated. The project has been added to workspace.`;
        } else {
          successInfoMessage = `Project ${this.currentProjectName} has been generated.`;
        }
      } else {
        // Fallback to original messages if no project name
        if (selectedWorkspace === this.messages.open_in_a_new_workspace) {
          successInfoMessage =
            this.messages.artifact_generated_project_open_in_a_new_workspace;
        } else if (selectedWorkspace === this.messages.add_to_workspace) {
          successInfoMessage =
            this.messages.artifact_generated_project_add_to_workspace;
        } else {
          successInfoMessage =
            this.messages.artifact_generated_project_saved_for_future;
        }
      }
    } else if (type === "module") {
      successInfoMessage = this.messages.artifact_generated_module;
    } else if (type === "") {
      successInfoMessage = ""; // do not show information message
    }
    return successInfoMessage;
  }
}
