import { expect } from "chai";
import * as sinon from "sinon";
import { describe, afterEach, it } from "mocha";
import * as API from "../src/api";
import * as logger from "../src/logger";
import * as Client from "../src/client";

describe("isFeatureEnabled", () => {
  afterEach(() => {
    sinon.restore();
  });

  const testFailure = async (extensionName: string, featureToggleName: string, errMessage: string): Promise<void> => {
    const loggerSpy = sinon.stub(logger, "log");
    const isFeatureEnabled = await API.isFeatureEnabled(extensionName, featureToggleName);

    expect(isFeatureEnabled).to.be.false; // on error return false
    expect(loggerSpy.callCount).to.equal(2);

    const infoMessage = `Checking if Extension Name: "${extensionName}", Feature Toggle Name: "${featureToggleName}" is enabled`;
    expect(loggerSpy.args[0][0]).to.equal(infoMessage); // infoMessage
    expect(loggerSpy.args[1][0]).to.equal(errMessage); // exception error
  };

  it("extension name is empty - throw Error and return false", async () => {
    const errMessage = `[ERROR] Failed to determine if feature toggle .aaa is enabled. Returning feature DISABLED. Error message: Error: Feature toggle extension name can not be empty, null or undefined`;
    await testFailure("", "aaa", errMessage);
  });

  it("featureToggleName is empty - throw Error and return false", async () => {
    const errMessage = `[ERROR] Failed to determine if feature toggle bla. is enabled. Returning feature DISABLED. Error message: Error: Feature toggle name can not be empty, null or undefined`;
    await testFailure("bla", "", errMessage);
  });

  it("returns same value as findToggleAndReturnState return true", async () => {
    sinon.stub(Client, "findToggleAndReturnState").resolves(true);

    const isEnabled = await API.isFeatureEnabled("extensionName", "ftName");
    expect(isEnabled).to.be.true;
  });
});
