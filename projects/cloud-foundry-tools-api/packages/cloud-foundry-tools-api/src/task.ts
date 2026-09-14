import * as fs from "fs";
import * as path from "path";
import * as _ from "lodash";
import { parse, stringify } from "comment-json";

const DEFAULT_TASKS_JSON_CONTENT: unknown = { version: "2.0.0", tasks: [] };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getTaskJsonContentAsJsonObject(taskJsonFilePath: string): Promise<any> {
  try {
    const tasksJsonString = await fs.promises.readFile(taskJsonFilePath, { encoding: "utf8" });
    const tasksJson: unknown = parse(tasksJsonString);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return _.assign(DEFAULT_TASKS_JSON_CONTENT, tasksJson);
  } catch (e) {
    // ignore, probably file or folder is missing
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return DEFAULT_TASKS_JSON_CONTENT;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function saveTaskConfiguration(wsFolderPath: string, configuration: any): Promise<void> {
  const taskJsonFilePath = path.join(wsFolderPath, ".vscode", "tasks.json");
  const tasksJson = await getTaskJsonContentAsJsonObject(taskJsonFilePath);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existingTaskindex = tasksJson.tasks.findIndex((task: any) => task.label === configuration.label);
  if (existingTaskindex >= 0) {
    tasksJson.tasks[existingTaskindex] = configuration;
  } else {
    tasksJson.tasks.push(configuration);
  }

  await fs.promises.writeFile(taskJsonFilePath, stringify(tasksJson, undefined, "  "));
}
