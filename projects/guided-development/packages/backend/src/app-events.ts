import { BasAction } from "@sap-devx/app-studio-toolkit-types";
import { ICollection, IItem, ITurotial } from "@sap_oss/guided-development-types";

export interface AppEvents {
  performAction(action: BasAction): Promise<any>;
  setData(extensionId: string, collections: ICollection[], items: IItem[], tutorials?: ITurotial[]): void;
}
