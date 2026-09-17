import { isFeatureEnabled } from "../api";

const EXTENSION_NAME = "auto_code";
const FEATURE_TOGGLE_NAME = "ts_feature";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

(async (): Promise<void> => {
  for (let i = 0; i < 8; i++) {
    if (await isFeatureEnabled(EXTENSION_NAME, FEATURE_TOGGLE_NAME)) {
      console.log(`Feature is Enabled`);
    } else {
      console.log(`Feature is Disabled`);
    }
    await delay(2000);
  }
})();
