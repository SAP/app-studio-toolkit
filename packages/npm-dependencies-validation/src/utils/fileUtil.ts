// importing directly from `fs/promises` is not supported on nodejs 12
import { promises, constants } from "fs";
const { access } = promises;
import { basename, join, dirname } from "path";
import { FilePaths } from "../types";

export function toJsonObject<T>(jsonContent: string): T {
  try {
    const jsonObj: T = JSON.parse(jsonContent);
    return jsonObj;
  } catch (error) {
    return emptyJsonObject<T>();
  }
}

export async function isPathExist(absPath: string): Promise<boolean> {
  try {
    await access(absPath, constants.R_OK);
    return true;
  } catch (error) {
    return false;
  }
}

export function emptyJsonObject<T>(): T {
  return {} as T;
}

function isPathEndsWith(absPath: string, fileName: string): boolean {
  return basename(absPath) === fileName;
}

export function createFilePaths(absPath: string, fileName: string): FilePaths {
  const endsWithFilename = isPathEndsWith(absPath, fileName);
  return {
    filePath: endsWithFilename ? absPath : join(absPath, fileName),
    dirPath: endsWithFilename ? dirname(absPath) : absPath,
  };
}
