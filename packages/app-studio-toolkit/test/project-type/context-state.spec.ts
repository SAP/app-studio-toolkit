import { expect } from "chai";
import { Project } from "@sap/artifact-management";
import { transformProjectApiToTagsMaps } from "../../src/project-type/context-state";

describe.only("custom VSCode contexts using @sap/artifact-management tags", () => {
  context("full flow", () => {});

  context("transformProjectApiToTagsMaps()", () => {
    let inputProject: Project;
    before(() => {
      inputProject = {
        name: "myProj",
        path: "root",
        modules: [
          {
            name: "db",
            path: "root/db",
            tags: ["CAP"],
            type: "???",
            items: [
              {
                name: "students.csv",
                path: "students.csv",
                tags: ["CAP"],
                type: "???",
                ref: "???",
              },
              {
                name: "teachers.csv",
                path: "teachers.csv",
                tags: ["CAP"],
                type: "???",
                ref: "???",
              },
            ],
          },
        ],
        tags: ["UI5", "CAP"],
        cloudService: "???",
        prefix: "???",
        type: "???",
      };
    });

    it("can convert a simple `Project` to TagsMaps", () => {
      const outputTagsToPaths = transformProjectApiToTagsMaps(inputProject);
      expect(outputTagsToPaths).to.have.lengthOf(2);
      expect(outputTagsToPaths).to.have.keys(["UI5", "CAP"]);

      const ui5Paths = outputTagsToPaths.get("UI5");
      expect(ui5Paths).to.have.lengthOf(1);
      expect(ui5Paths).to.have.keys(["root"]);

      const capPaths = outputTagsToPaths.get("CAP");
      expect(capPaths).to.have.lengthOf(4);
      expect(capPaths).to.have.keys([
        // TODO: build string with OS specific file separator
        "root",
        "root\\root\\db",
        "root\\students.csv",
        "root\\teachers.csv",
      ]);
    });
  });
});
