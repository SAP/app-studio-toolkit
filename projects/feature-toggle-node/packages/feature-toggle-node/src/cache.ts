import * as NodeCache from "node-cache";
import { Features } from "./client";

const FEATURES_KEY = "features";
const ftCache = new NodeCache();

/*
 * Example of cache structure:
 *   [features]: { features: [] }     - keep last response with all toggles
 *   [toggleName]: boolean            - value of toggles by name that has been called in last ${REFRESH_INTERVAL} minutes
 * */

export function getFeatureToggles(): Features | undefined {
  return ftCache.get(FEATURES_KEY);
}

export function setFeatureToggles(toggles: Features | undefined): void {
  ftCache.set(FEATURES_KEY, toggles);
}

export function getToggleByKey(key: string): boolean | undefined {
  return ftCache.get(key);
}

export function setTogglesByKey(key: string, value: boolean): void {
  ftCache.set(key, value);
}

export function flushCache(): void {
  ftCache.flushAll();
}
