import * as _ from "lodash";
import { getModuleLogger } from "./logger/logger-wrapper";
import { toText, writeProperties } from "./utils";
import * as PropertiesReader from "properties-reader";

const LOGGER_MODULE = "chisel";

//Chisel fields array
enum ChiselKeys {
  CHISEL_URL = "CHISEL_URL",
  CHISEL_USER = "CHISEL_USER",
  CHISEL_PASSWORD = "CHISEL_PASSWORD",
  TUNNEL_PARAM = "TUNNEL_PARAM",
}

function initReader(filePath: string): PropertiesReader.Reader | undefined {
  try {
    return PropertiesReader(filePath);
  } catch (e) {
    /* eslint-disable-next-line @typescript-eslint/no-unsafe-argument */
    getModuleLogger(LOGGER_MODULE).error(
      "checkAndCreateChiselTask: propertiesReader : environment file is broken or not exists",
      { filePath: filePath },
      { exception: toText(new Error(e?.message as string)) }
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function checkAndCreateChiselTask(filePath: string, name: string): any | undefined {
  const envProperties = initReader(filePath);
  if (envProperties) {
    const chiselUrl = envProperties.get(ChiselKeys.CHISEL_URL);
    if (_.isEmpty(chiselUrl)) {
      getModuleLogger(LOGGER_MODULE).debug("checkAndCreateChiselTask: empty chisel_url", { filePath: filePath });
      return undefined;
    }
    getModuleLogger(LOGGER_MODULE).debug(
      "checkAndCreateChiselTask: chisel task <%s> composed",
      `openChiselTunnerFor-${name}`,
      { filePath: filePath }
    );
    return {
      label: `openChiselTunnerFor-${name}`,
      type: "shell",
      command: "chisel",
      isBackground: true,
      problemMatcher: "$chisel-client",
      args: [
        "client",
        "--auth",
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        `${envProperties.get(ChiselKeys.CHISEL_USER)}:${envProperties.get(ChiselKeys.CHISEL_PASSWORD)}`,
        chiselUrl,
        envProperties.get(ChiselKeys.TUNNEL_PARAM),
      ],
    };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dropChiselProperties(propObj: any): Record<string, string> {
  const properties: Record<string, string> = {};
  _.each(_.keys(propObj), (key) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!(Object as any).values(ChiselKeys).includes(key)) {
      const value = propObj[key];
      if (!_.isEmpty(value)) {
        properties[key] = value;
      }
    }
  });
  return properties;
}

export async function deleteChiselParamsFromFile(filePath: string): Promise<boolean> {
  const envProperties = initReader(filePath);
  if (!envProperties) {
    return false;
  }
  const chiselUrl = envProperties.get(ChiselKeys.CHISEL_URL);
  if (_.isEmpty(chiselUrl)) {
    return false;
  }
  try {
    await writeProperties(filePath, dropChiselProperties(envProperties.getAllProperties()));
    getModuleLogger(LOGGER_MODULE).debug(
      `deleteChiselParamsFromFile: override the paramters to ${filePath} file without chisel parameters`
    );
    return true;
  } catch (err) {
    /* eslint-disable-next-line @typescript-eslint/no-unsafe-argument */
    getModuleLogger(
      LOGGER_MODULE
    ).error(
      `deleteChiselParamsFromFile: failed to override the paramters to ${filePath} file without chisel parameters`,
      { exception: toText(new Error(err?.message as string)) }
    );
    return false;
  }
}
