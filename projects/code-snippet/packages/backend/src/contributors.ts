import * as vscode from "vscode";
import _ from "lodash";
import { IChildLogger } from "@vscode-logging/logger";
import { getClassLogger } from "./logger/logger-wrapper";

export class Contributors {
  private readonly logger: IChildLogger;

  constructor() {
    this.logger = getClassLogger("Contributors");
  }

  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types -- legacy code + too many 'any' types...
  public async getSnippet(contributorInfo: unknown) {
    const contributorId = _.get(contributorInfo, "contributorId");
    const extension = this.getContributorExtension(contributorId);
    if (extension) {
      try {
        const api = await this.getApiPromise(
          extension as vscode.Extension<any>
        );
        const snippetContext = _.get(contributorInfo, "context");
        const snippets = api.getCodeSnippets(snippetContext);
        const snippetName = _.get(contributorInfo, "snippetName");
        return snippets.get(snippetName);
      } catch (error) {
        const errorMessage = _.get(
          error,
          "stack",
          _.get(error, "message", error)
        );
        this.logger.error(
          `Could not get '${contributorId}' snippet`,
          errorMessage
        );
      }
    }
  }

  private getApiPromise(extension: vscode.Extension<any>): Thenable<any> {
    return extension.isActive
      ? Promise.resolve(extension.exports)
      : extension.activate();
  }

  private getContributorExtension(contributorId: string) {
    // Pre-compile regex pattern for better performance
    const FRAMEWORK_PATTERN = /^saposs\.code-snippet(?:-tool)?$/;

    return _.find(vscode.extensions.all, (extension: vscode.Extension<any>) => {
      const extensionDependencies: string[] = _.get(
        extension,
        "packageJSON.extensionDependencies",
        []
      );
      if (extensionDependencies.some((dep) => FRAMEWORK_PATTERN.test(dep))) {
        if (contributorId === this.getExtensionId(extension)) {
          return extension;
        }
      }

      this.logger.warn(`Extension '${contributorId}' could not be found.`);
    });
  }

  private getExtensionId(extension: vscode.Extension<any>) {
    const extensionName: string = _.get(extension, "packageJSON.name");
    const extensionPublisher: string = _.get(
      extension,
      "packageJSON.publisher"
    );
    return `${extensionPublisher}.${extensionName}`;
  }
}
