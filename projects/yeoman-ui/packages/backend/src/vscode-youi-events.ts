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
  private resolveFunc: (() => void) | undefined;
  private progressReporter: {
    report(value: { message?: string; increment?: number }): void;
  } | null = null;
  private currentProjectName: string | undefined;
  private phaseStartTime: number = 0;
  private currentPhase: "writing" | "install" | "end" | null = null;
  private isEnhancedProgressMode: boolean = false; // Track if enhanced progress is active
  private pendingPhaseTimer: NodeJS.Timeout | null = null; // Track pending timer to allow cancellation
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

  public async doGeneratorDone(
    success: boolean,
    message: string,
    selectedWorkspace: string,
    type: string,
    targetFolderPath?: string
  ): Promise<any> {
    // Cancel any pending phase transition timer
    if (this.pendingPhaseTimer) {
      clearTimeout(this.pendingPhaseTimer);
      this.pendingPhaseTimer = null;
    }

    // Show "Finalising..." before closing (only if enhanced progress mode is active)
    if (this.progressReporter && this.isEnhancedProgressMode) {
      this.progressReporter.report({
        message: this.messages.progress_finalising,
      });
      // Add a brief delay so "Finalising..." is visible to users
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    this.resolveInstallingProgress();
    set(this.webviewPanel, Constants.GENERATOR_COMPLETED, success);
    this.doClose();
    return this.showDoneMessage(
      success,
      message,
      selectedWorkspace,
      type,
      targetFolderPath,
      true // Skip resolving progress since we already did it
    );
  }

  public doGeneratorInstall(): void {
    this.doClose();
    this.isEnhancedProgressMode = false; // Classic mode
    // Classic mode: pass empty string to avoid duplicate message
    this.showInstallMessage(undefined, "");
  }

  public doGeneratorProgress(
    projectName: string | undefined,
    phase: "writing" | "install" | "end",
    showProgress: boolean = false
  ): void {
    // Backward compatibility: if generator doesn't opt in, fall back to classic behavior
    // (only show toast on "install" phase)
    if (!showProgress) {
      if (phase === "install") {
        // Show classic "Installing dependencies..." toast
        this.doGeneratorInstall();
      }
      return;
    }

    // Enhanced mode: show multi-phase progress
    const phaseMessages = {
      writing: this.messages.progress_writing_files,
      install: this.messages.progress_installing,
      end: this.messages.progress_finalising,
    };

    const MIN_DURATIONS = {
      writing: 2000,
      install: 0,
      end: 1000,
    };

    const message = phaseMessages[phase];

    // If this is the first phase AND no progress notification exists yet
    if (!this.progressReporter) {
      // Close the webview panel (showing the question form) before showing progress
      // Set GENERATOR_COMPLETED first to prevent false "manual close" telemetry
      set(this.webviewPanel, Constants.GENERATOR_COMPLETED, true);
      this.doClose();
      this.isEnhancedProgressMode = true; // Enhanced mode active
      this.currentPhase = phase;
      this.phaseStartTime = Date.now();
      this.showInstallMessage(projectName, message);
    } else if (this.progressReporter) {
      // Cancel any pending phase transition timer before scheduling a new one
      if (this.pendingPhaseTimer) {
        clearTimeout(this.pendingPhaseTimer);
        this.pendingPhaseTimer = null;
      }

      // Calculate time elapsed in current phase
      const elapsed = Date.now() - this.phaseStartTime;
      const minDuration = this.currentPhase
        ? MIN_DURATIONS[this.currentPhase]
        : 0;
      const remainingTime = Math.max(0, minDuration - elapsed);

      if (remainingTime > 0) {
        // Wait for minimum duration before showing next phase
        // Capture current reporter instance to prevent race conditions
        const currentReporter = this.progressReporter;
        this.pendingPhaseTimer = setTimeout(() => {
          // Clear the timer reference since it has fired
          this.pendingPhaseTimer = null;
          // Only update if reporter hasn't changed (generator still running)
          if (this.progressReporter === currentReporter) {
            this.progressReporter.report({ message });
            this.currentPhase = phase;
            this.phaseStartTime = Date.now();
          }
        }, remainingTime);
      } else {
        // Minimum duration already elapsed, update immediately
        this.progressReporter.report({ message });
        this.currentPhase = phase;
        this.phaseStartTime = Date.now();
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
    initialMessage: string = this.messages.progress_preparing
  ): void {
    // Store project name for later use in success message
    this.currentProjectName = projectName;

    // Determine if this is enhanced mode (any of the progress messages)
    const isEnhancedMode =
      initialMessage === this.messages.progress_preparing ||
      initialMessage === this.messages.progress_writing_files ||
      initialMessage === this.messages.progress_installing ||
      initialMessage === this.messages.progress_finalising;

    // Determine title:
    // - Enhanced mode: "Generating {projectName}" or "Generating..."
    // - Classic mode: "Installing dependencies..."
    const title = isEnhancedMode
      ? projectName
        ? `Generating ${projectName}`
        : "Generating..."
      : "Installing dependencies...";

    void vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: title,
        cancellable: false,
      },
      async (progress) => {
        // Store the progress reporter so we can update it (for new progress system)
        this.progressReporter = progress;
        // Classic mode: initialMessage is empty string, keep it empty to show title only
        // Enhanced mode: initialMessage has a message, show it in body
        progress.report({ message: initialMessage });

        // Keep the notification open until generation completes
        await new Promise<void>((resolve) => {
          this.resolveFunc = resolve;
        });

        // Clean up the progress reporter and reset state for next run
        this.progressReporter = null;
        this.isEnhancedProgressMode = false;
        this.currentPhase = null;
        this.phaseStartTime = 0;
        this.currentProjectName = undefined;
        // Clear any pending phase timer
        if (this.pendingPhaseTimer) {
          clearTimeout(this.pendingPhaseTimer);
          this.pendingPhaseTimer = null;
        }
      }
    );
  }

  private resolveInstallingProgress() {
    if (this.resolveFunc) {
      this.resolveFunc();
      this.resolveFunc = undefined; // Clear to prevent reuse
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
