import { expect } from "chai";
import { mockVscode } from "../mockUtil";
import { createSandbox, SinonMock, SinonSandbox } from "sinon";

const extensions = { getExtension: () => undefined };
const testVscode = {
  extensions,
};

mockVscode(testVscode, "dist/src/logger/logger.js");
mockVscode(testVscode, "dist/src/apis/validateLCAP.js");
mockVscode(testVscode, "dist/src/apis/validateFioriCapabilities.js");
import { isLCAPEnabled, LACP_EXTENSION_ID } from "../../src/apis/validateLCAP";
import {
  hasFioriCapabilities,
  FIORI_EXTENSION_ID,
} from "../../src/apis/validateFioriCapabilities";
import {
  hasCapCapabilities,
  CAP_EXTENSION_ID,
} from "../../src/apis/validateCapCapabilities";

describe("validate capabilities API", () => {
  it("should return false", async () => {
    const parameterValue = await isLCAPEnabled();
    expect(parameterValue).to.be.false;
  });

  describe("validate returned value according to the extension existence", () => {
    let extensionsMock: SinonMock;
    let sandbox: SinonSandbox;

    before(() => {
      sandbox = createSandbox();
    });

    after(() => {
      sandbox.restore();
    });

    beforeEach(() => {
      extensionsMock = sandbox.mock(testVscode.extensions);
    });

    afterEach(() => {
      extensionsMock.verify();
    });

    it("should return false when LCAP extension does not exist", async () => {
      extensionsMock
        .expects("getExtension")
        .withExactArgs(LACP_EXTENSION_ID)
        .returns(undefined);
      const parameterValue = await isLCAPEnabled();
      expect(parameterValue).to.be.false;
    });

    it("should return true when LCAP extension exists", async () => {
      const extension = { id: LACP_EXTENSION_ID };
      extensionsMock
        .expects("getExtension")
        .withExactArgs(LACP_EXTENSION_ID)
        .returns(extension);
      const parameterValue = await isLCAPEnabled();
      expect(parameterValue).to.be.true;
    });

    it("should return false when Fiori extension does not exist", async () => {
      extensionsMock
        .expects("getExtension")
        .withExactArgs(FIORI_EXTENSION_ID)
        .returns(undefined);
      const parameterValue = await hasFioriCapabilities();
      expect(parameterValue).to.be.false;
    });

    it("should return true when Fiori extension exists", async () => {
      const extension = { id: FIORI_EXTENSION_ID };
      extensionsMock
        .expects("getExtension")
        .withExactArgs(FIORI_EXTENSION_ID)
        .returns(extension);
      const parameterValue = await hasFioriCapabilities();
      expect(parameterValue).to.be.true;
    });
    it("should return false when Cap extension does not exist", async () => {
      extensionsMock
        .expects("getExtension")
        .withExactArgs(CAP_EXTENSION_ID)
        .returns(undefined);
      const parameterValue = await hasCapCapabilities();
      expect(parameterValue).to.be.false;
    });

    it("should return true when Cap extension exists", async () => {
      const extension = { id: CAP_EXTENSION_ID };
      extensionsMock
        .expects("getExtension")
        .withExactArgs(CAP_EXTENSION_ID)
        .returns(extension);
      const parameterValue = await hasCapCapabilities();
      expect(parameterValue).to.be.true;
    });
  });
});
