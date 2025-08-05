import { expect } from "chai";
import { getWsID, getTenantPlan } from "../../src/helper-logic/constants";

describe("Constants module", () => {
  context("getWsID function", () => {
    const orgWSId = process.env["WORKSPACE_ID"];
    before(() => {
      delete process.env["WORKSPACE_ID"];
    });

    after(() => {
      process.env["WORKSPACE_ID"] = orgWSId;
    });

    it("should return `unknown` WS_ID when no `WORKSPACE_ID` env variable set", () => {
      expect(getWsID()).to.equal("unknown");
    });

    it("should return the actual ID when `WORKSPACE_ID` env variable is set", () => {
      process.env["WORKSPACE_ID"] = "workspaces-ws-abcd5";
      expect(getWsID()).to.equal("abcd5");
    });
  });

  context("getTenantPlan function", () => {
    const orgTenantPlan = process.env["TENANT_PLAN"];
    before(() => {
      delete process.env["TENANT_PLAN"];
    });

    after(() => {
      process.env["TENANT_PLAN"] = orgTenantPlan;
    });

    it("should return `unknown` plan when no `TENANT_PLAN` env variable set", () => {
      expect(getTenantPlan()).to.equal("unknown");
    });

    it("should return the actual plan when `TENANT_PLAN` env variable is set", () => {
      process.env["TENANT_PLAN"] = "plan-abc123";
      expect(getTenantPlan()).to.equal("abc123");
    });
  });
});
