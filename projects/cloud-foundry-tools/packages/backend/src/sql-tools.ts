import * as vscode from "vscode";
import { dataContentAsObject } from "@sap/cf-tools";
import * as _ from "lodash";
import { parse } from "comment-json";

const CONNECTIONS = "connections";

function saveSettings(filePath: string, configuration: any) {
  const sqltoolsSettings = vscode.workspace.getConfiguration("sqltools", vscode.Uri.file(filePath));
  const connections: any[] = sqltoolsSettings.get(CONNECTIONS) || [];

  const existingConnIndex = connections.findIndex((conn: any) => conn.name === configuration.name);
  if (existingConnIndex >= 0) {
    connections[existingConnIndex] = configuration;
  } else {
    connections.push(configuration);
  }
  void sqltoolsSettings.update(CONNECTIONS, connections);
}

export async function checkAndCreateSQLToolsSettings(filePath: string): Promise<string> {
  const envFileContent = await dataContentAsObject(filePath);
  const vcapServicesStr = _.get(envFileContent, "VCAP_SERVICES");
  if (vcapServicesStr) {
    /* eslint-disable-next-line @typescript-eslint/no-unsafe-argument */
    const vcapServices = parse(vcapServicesStr);
    const hanaServices = _.get(vcapServices, "hana");
    if (hanaServices) {
      const serviceNames = _.map(hanaServices, (srv) => {
        const conn = {
          name: _.get(srv, "name"),
          dialect: "SAPHana",
          database: _.get(srv, "credentials.schema"),
          server: _.get(srv, "credentials.host"),
          /* eslint-disable-next-line @typescript-eslint/no-unsafe-argument */
          port: Number.parseInt(_.get(srv, "credentials.port"), 10),
          username: _.get(srv, "credentials.user"),
          password: _.get(srv, "credentials.password"),
          connectionTimeout: 30,
        };
        saveSettings(filePath, conn);
        return srv.name as string;
      });
      return serviceNames.join(",");
    }
  }

  return "";
}
