export { HOME_DIR, WS_ID };

const HOME_DIR = "~";

const wsIdRaw = process.env.WORKSPACE_ID;
const WS_ID = wsIdRaw ? wsIdRaw.replace("workspaces-ws-", "") : "unknown";
