import * as vscode from "vscode";
import { ActionsFactory } from "./actionsFactory";
import { IAction } from "./interfaces";
import { _performAction } from "./performer";


export class ActionsController {
    private readonly actions: IAction[] = [];

    loadActions() {
        this.getContributorExtension();
    }

    getContributorExtension() {
        vscode.extensions.all.forEach((extension) => {
            if (extension.packageJSON.BAScontributes && extension.packageJSON.BAScontributes.actions)
            {
                this.actions.push(extension.packageJSON.BAScontributes.actions);
            }
        });
    }

    performScheduledActions() {
        const actionsSettings = vscode.workspace.getConfiguration();
        const actionsList: any[] | undefined = actionsSettings.get("actions");
        if (actionsList && actionsList.length) {
          for (const action of actionsList) {
            console.log(
              `performing action ${action.name} of type ${action.constructor.name}`
            );
            _performAction(action);
          }
          actionsSettings.update("actions", []);
        }
      }
}





  // return _.find(vscode.extensions.all, (extension: vscode.Extension<any>) => {
  //     const extensionDependencies: string[] = _.get(extension, "packageJSON.extensionDependencies");
  //     if (_.includes(extensionDependencies, "saposs.code-snippet")) {
  //         if (contributorId === this.getExtensionId(extension)) {
  //             return extension;
  //         }
  //     }

  //     this.logger.warn(`Extension '${contributorId}' could not be found.`);
  // });

