import { expect } from "chai";
import { getWsID } from "../../src/helper-logic/constants";

describe("Constants module", () => {
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
