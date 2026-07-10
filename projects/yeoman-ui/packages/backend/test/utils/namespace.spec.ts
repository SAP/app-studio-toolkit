import { expect } from "chai";
import { namespaceToName } from "../../src/utils/namespace.js";

describe("namespace utility", () => {
  describe("namespaceToName()", () => {
    it("strips the sub-generator segment from a scoped namespace", () => {
      expect(namespaceToName("@sap/adaptation-project:app")).to.equal(
        "@sap/adaptation-project"
      );
    });

    it("drops the generator- prefix on a scoped package", () => {
      expect(namespaceToName("@bas-dev/generator-abap-project:app")).to.equal(
        "@bas-dev/abap-project"
      );
    });

    it("drops the generator- prefix on a bare package", () => {
      expect(namespaceToName("generator-foo:app")).to.equal("foo");
    });

    it("returns the namespace unchanged when no colon or generator- prefix", () => {
      expect(namespaceToName("plain-name")).to.equal("plain-name");
    });
  });
});
