export { HOME_DIR, DISK_USAGE_TIMESTAMP, getWsID, getTenantPlan };

// "~" did not work perfectly for all shell commands
// using `/` is safe as this extension is only meant to run under linux
const HOME_DIR = "/home/user";
const DISK_USAGE_TIMESTAMP = "bas-disk-usage-report-timestamp";

function getWsID(): string {
  const wsIdRaw = process.env.WORKSPACE_ID;
  const id = wsIdRaw ? wsIdRaw.replace("workspaces-ws-", "") : "unknown";
  return id;
}

function getTenantPlan(): string {
  const tenantPlanRaw = process.env.TENANT_PLAN;
  const plan = tenantPlanRaw ? tenantPlanRaw.replace("plan-", "") : "unknown";
  return plan;
}
