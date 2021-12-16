import * as sinon from "sinon";
import { each, find, map, size } from "lodash";
import { join, normalize } from "path";
import { expect } from "chai";
import { Project } from "@sap/artifact-management";
import * as watcher from "../../src/project-type/watcher";
import { ProjectApiRead, SetContext } from "../../src/project-type/types";
import {
  ITEM,
  MODULE,
  PROJECT,
  PROJECT_API_WRAPPER,
} from "./project-struct-builders";

describe("custom VSCode contexts using @sap/artifact-management tags", () => {
  let sandbox: sinon.SinonSandbox;

  before(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("watcher module", () => {
    let setContextArgs: { contextName: string; paths: string[] }[] = [];
    const setContextMock: SetContext = (contextName, paths) => {
      setContextArgs.push({ contextName, paths });
    };

    const optsContext = {
      onProjectChangeListener: [] as (() => void)[],
      onWorkspaceChangeListeners: [] as (() => void)[],
    };

    const projectApi = {
      readItems: () =>
        Promise.resolve([
          {
            type: "test-type",
            name: "test-tech-name",
          },
        ]),
      addListener: (e: string, listener: () => {}) => {
        optsContext.onProjectChangeListener.push(listener);
      },
      destroy: () => {},
    };

    function _genNProjectWatchers(projects: Project[]) {
      return map(projects, (project) => {
        return {
          watchItems: () => Promise.resolve(projectApi),
          read: () => Promise.resolve(project),
        };
      });
    }

    const zProjects: Project[] = [
      PROJECT({
        path: "/user/projects/Z",
        modules: [
          MODULE({
            path: "db",
            tags: ["ZZZ"],
            items: [
              ITEM({
                path: normalize("db/teachers.csv"),
                tags: ["ZZZ"],
              }),
            ],
          }),
        ],
        tags: ["ZZZ"],
      }),
    ];

    let mockProjects = _genNProjectWatchers(zProjects);

    const mockWsWatcherApi = {
      getProjects: () => Promise.resolve(mockProjects),
      onWorkspaceChanged: (listener: () => {}) => {
        optsContext.onWorkspaceChangeListeners.push(listener);
      },
    };

    const opts = {
      getWorkspaceAPI: () => {
        return mockWsWatcherApi as unknown as watcher.WorkspaceAPIForWatcher;
      },
      setContext: setContextMock,
    };

    afterEach(() => {
      watcher.internal.projectWatchers.clear();
      optsContext.onWorkspaceChangeListeners = [];
      optsContext.onProjectChangeListener = [];
      setContextArgs = [];
    });

    context("initProjectTypeWatchers()", () => {
      it("initProjectTypeWatchers - verify register project listeners", async () => {
        await watcher.initProjectTypeWatchers(opts);
        expect(watcher.internal.projectWatchers.size).to.equal(1);
        const projWatcherEntries = Array.from(
          watcher.internal.projectWatchers.entries()
        );
        for (const [_, currItemWatcher] of projWatcherEntries) {
          expect(await currItemWatcher.readItems()).to.be.deep.equal(
            await projectApi.readItems()
          );
        }
      });
    });

    context("project item changed", () => {
      const projects: Project[] = [
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
      ];

      beforeEach(async () => {
        mockProjects = _genNProjectWatchers(zProjects);
        await watcher.initProjectTypeWatchers(opts);
        mockProjects = _genNProjectWatchers(projects);
      });

      it("will re-calculate **all** custom contexts on `updated` event", async () => {
        expect(size(optsContext.onProjectChangeListener)).to.be.equal(1);
        // trigger onProjectChange event
        optsContext.onProjectChangeListener[0]();
        return new Promise((resolve) => {
          setTimeout(() => {
            expect(size(setContextArgs)).to.be.equal(2);
            each(projects, (project) => {
              const context = find(setContextArgs, [
                "contextName",
                `sapProjectType:${project.tags[0]}`,
              ]) || { paths: [] };
              expect(size(context.paths)).be.equal(3);
              expect(context.paths[0]).be.equal(normalize(project.path));
              expect(context.paths[1]).be.equal(
                normalize(join(project.path, project.modules[0].path))
              );
              expect(context.paths[2]).be.equal(
                normalize(join(project.path, project.modules[0].items[0].path))
              );
            });
            resolve();
          }, 2000);
        });
      }).timeout(5000);

      it("will debounce re-calculating custom contexts to reduce CPU load", async () => {
        const mockGetApi = sandbox.mock(mockWsWatcherApi);
        // expect to be called once when debounced
        mockGetApi.expects("getProjects").calledOnce;
        // trigger onProjectChange event 3 times
        optsContext.onProjectChangeListener[0]();
        optsContext.onProjectChangeListener[0]();
        optsContext.onProjectChangeListener[0]();
        return new Promise((resolve) => {
          setTimeout(() => {
            mockGetApi.verify();
            resolve();
          }, 3000);
        });
      }).timeout(5000);
    });

    context("workspace changed - project added", () => {
      const projects: Project[] = [
        PROJECT({
          path: "/user/projects/A2",
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
          path: "/user/root/B2",
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
      ];

      before(async () => {
        mockProjects = _genNProjectWatchers(zProjects);
        await watcher.initProjectTypeWatchers(opts);
        mockProjects = _genNProjectWatchers(projects);
      });

      it("will re-calculate **all** custom contexts on `workspaceChanged` event and update project listeners", async () => {
        expect(watcher.internal.projectWatchers.size).equal(1);
        expect(size(optsContext.onWorkspaceChangeListeners)).to.be.equal(1);
        // trigger onWorkspaceChange event
        optsContext.onWorkspaceChangeListeners[0]();
        return new Promise((resolve) => {
          setTimeout(() => {
            expect(size(setContextArgs)).to.be.equal(2);
            each(projects, (project) => {
              const context = find(setContextArgs, [
                "contextName",
                `sapProjectType:${project.tags[0]}`,
              ]) || { paths: [] };
              expect(size(context.paths)).be.equal(3);
              expect(context.paths[0]).be.equal(normalize(project.path));
              expect(context.paths[1]).be.equal(
                normalize(join(project.path, project.modules[0].path))
              );
              expect(context.paths[2]).be.equal(
                normalize(join(project.path, project.modules[0].items[0].path))
              );
            });
            expect(watcher.internal.projectWatchers.size).equal(2);
            resolve();
          }, 2000);
        });
      }).timeout(5000);
    });

    context("workspace changed - project deleted", () => {
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

      it("will re-calculate **all** custom contexts on `workspaceChanged` event and update project listeners", async () => {});

      after(() => {
        // TODO: do we need cleanup?
        //       probably yes...
        //      maybe not if we use rewire?
      });
    });
  });
});
