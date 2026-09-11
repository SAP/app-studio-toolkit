import { isFeatureEnabled } from "../api";

const EXTENSION_NAME = "auto_code";
const FEATURE_TOGGLE_NAME = "ts_feature";

(async (): Promise<void> => {
  if (await isFeatureEnabled(EXTENSION_NAME, FEATURE_TOGGLE_NAME)) {
    console.log(`Feature is Enabled`);
  } else {
    console.log(`Feature is Disabled`);
  }
})();
