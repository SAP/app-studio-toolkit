import * as Cache from "./cache";
import { requestFeatureToggles } from "./request";
import { isToggleEnabled } from "./strategies";
import { log } from "./logger";

export interface Parameters {
  environments: string[]; // apps
  infrastructures: string[]; //iaass
  landscapes: string[]; // regions
  subaccounts: string[];
  users: string[];
  wss: string[];
  tenantids: string[];
}

export interface Features {
  features: Toggle[];
}

export interface Toggle extends Parameters {
  name: string;
  description: string;
  disabled: boolean;
  strategies: boolean;
}

let isCched: boolean;

export async function requestTogglesAndSaveNewCache(): Promise<void> {
  const toggles = await requestFeatureToggles();
  if (toggles?.features?.length) {
    Cache.flushCache();
    Cache.setFeatureToggles(toggles);
    log("Feature toggle cache updated");
  }
}

export async function refreshCacheByInterval(): Promise<void> {
  await requestTogglesAndSaveNewCache();
}

async function getFeatureToggles(): Promise<Features | undefined> {
  let toggles: Features | undefined = Cache.getFeatureToggles();

  if (!toggles) {
    toggles = await requestFeatureToggles();
    Cache.setFeatureToggles(toggles);
  }
  return toggles;
}

function findToggleByName(toggles: Features, ftName: string): Toggle | undefined {
  return toggles.features.find((toggle) => toggle.name == ftName);
}

/*
 * Starts cache refresh by interval
 * Returns boolean value from cache by toggle name
 * if toggle name not present function takes all toggles from cache
 * and calculate specific toggle
 * in case cache with toggles empty
 * makes request to server, update cache and calculate toggle value
 * */
export async function findToggleAndReturnState(ftName: string): Promise<boolean> {
  if (!isCched) {
    await refreshCacheByInterval();
    isCched = true;
  }

  const toggleFromCache = Cache.getToggleByKey(ftName);

  if (toggleFromCache != undefined) {
    return toggleFromCache;
  }

  const toggles: Features | undefined = await getFeatureToggles();

  if (toggles?.features?.length) {
    const toggle: Toggle | undefined = findToggleByName(toggles, ftName);

    if (toggle) {
      const isEnabled = isToggleEnabled(toggle);
      Cache.setTogglesByKey(toggle.name, isEnabled);
      return isEnabled;
    }
  }

  return false;
}
