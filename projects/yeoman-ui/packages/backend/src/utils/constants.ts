import lodash from "lodash";
import { join } from "path";
import { homedir } from "os";
import { devspace } from "@sap/bas-sdk";

const { get, isEmpty } = lodash;

class ConstantsUtil {
  public IS_IN_BAS =
    !isEmpty(get(process, "env.WS_BASE_URL")) ||
    devspace.getBasMode() === "personal-edition";
  public HOMEDIR_PROJECTS: string = join(homedir(), "projects");
  public GENERATOR_COMPLETED: string = "generatorCompleted";
  public readonly ENV_INCOMPATIBILITY_MESSAGE_PREFIX: string =
    "Current environment doesn't provides some necessary feature this generator needs";
}

export const Constants = new ConstantsUtil();
