import { readFile } from "fs/promises";

export async function readResource(resourcePath: string): Promise<string> {
  return readFile(resourcePath, "utf8");
}
