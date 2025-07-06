export { HOME_DIR, WS_ID };

// "~" did not work perfectly for all shell commands
// using `/` is safe as this extension is only meant to run under linux
const HOME_DIR = "/home/user";

const wsIdRaw = process.env.WORKSPACE_ID;
const WS_ID = wsIdRaw ? wsIdRaw.replace("workspaces-ws-", "") : "unknown";
