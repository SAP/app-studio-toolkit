import { normalize } from "path";
import { expect } from "chai";
import { Project } from "@sap/artifact-management";
import {
  recomputeTagsContexts,
  transformProjectApiToTagsMaps,
} from "../../src/project-type/custom-context";
import { ProjectApiRead, SetContext } from "../../src/project-type/types";
import {
  ITEM,
  MODULE,
  PROJECT,
  PROJECT_API_WRAPPER,
} from "./project-struct-builders";

describe("custom VSCode contexts using @sap/artifact-management tags", () => {
  describe("custom-context module", () => {
    context("transformProjectApiToTagsMaps()", () => {
      let inputProject: Project;

      before(() => {
        inputProject = PROJECT({
          path: "/user/root",
          modules: [
            MODULE({
              path: "root/db",
              tags: ["CAP"],
              items: [
                ITEM({
                  path: "db/students.csv",
                  tags: ["CAP"],
                }),
                ITEM({
                  path: "db/teachers.csv",
                  tags: ["CAP"],
                }),
              ],
            }),
          ],
          tags: ["UI5", "CAP"],
        });
      });

      it("can convert a simple `Project` to TagsMaps", () => {
        const outputTagsToPaths = transformProjectApiToTagsMaps(inputProject);
        expect(outputTagsToPaths).to.have.lengthOf(2);
        expect(outputTagsToPaths).to.have.keys(["UI5", "CAP"]);

        const ui5Paths = outputTagsToPaths.get("UI5");
        expect(ui5Paths).to.have.lengthOf(1);
        expect(ui5Paths).to.have.keys([normalize("/user/root")]);

        const capPaths = outputTagsToPaths.get("CAP");
        expect(capPaths).to.have.lengthOf(4);
        expect(capPaths).to.have.keys([
          normalize("/user/root"),
          normalize("/user/root/root/db"),
          normalize("/user/root/db/students.csv"),
          normalize("/user/root/db/teachers.csv"),
        ]);
      });
    });

    context("recomputeTagsContexts()", () => {
      let inputProjectsAPIs: ProjectApiRead[];
      const setContextArgs: { contextName: string; paths: string[] }[] = [];

      const setContextMock: SetContext = (contextName, paths) => {
        setContextArgs.push({ contextName, paths });
      };

      before(() => {
        inputProjectsAPIs = PROJECT_API_WRAPPER([
          PROJECT({
            path: "/user/projects/A",
            modules: [
              MODULE({
                path: "db",
                tags: ["AAA"],
                items: [
                  ITEM({
                    path: "db/teachers.csv",
                    tags: ["AAA"],
                  }),
                ],
              }),
            ],
            tags: ["AAA"],
          }),
          PROJECT({
            path: "/user/root/B",
            modules: [
              MODULE({
                path: "view",
                tags: ["BBB"],
                items: [
                  ITEM({
                    path: "view/index.html",
                    tags: ["BBB"],
                  }),
                ],
              }),
            ],
            tags: ["BBB"],
          }),
        ]);
      });

      it("will invoke `setContext()` with the newly calculated TagsMap", async () => {
        expect(setContextArgs).to.be.empty;

        await recomputeTagsContexts(inputProjectsAPIs, setContextMock);

        expect(setContextArgs).to.have.lengthOf(2);
        expect(setContextArgs).to.have.deep.members([
          {
            contextName: "sapProjectType:AAA",
            paths: [
              normalize("/user/projects/A"),
              normalize("/user/projects/A/db"),
              normalize("/user/projects/A/db/teachers.csv"),
            ],
          },
          {
            contextName: "sapProjectType:BBB",
            paths: [
              normalize("/user/root/B"),
              normalize("/user/root/B/view"),
              normalize("/user/root/B/view/index.html"),
            ],
          },
        ]);
      });
    });
  });
});
