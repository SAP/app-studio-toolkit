// importing directly from `fs/promises` is not supported on nodejs 12
import { promises, constants } from "fs";
const { access } = promises;

export function toJsonObject<T>(jsonContent: string): T {
  try {
    const jsonObj: T = JSON.parse(jsonContent);
    return jsonObj;
  } catch (error) {
    return emptyJsonObject<T>();
  }
}

// TODO: use fs-extra instead
export async function doesPathExist(absPath: string): Promise<boolean> {
  try {
    await access(absPath, constants.R_OK);
    return true;
  } catch (error) {
    return false;
  }
}

export function emptyJsonObject<T>(): T {
  return Object.create(null) as T;
}
