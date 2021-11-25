// import { normalize } from "path";
// import { expect } from "chai";
// import { Project } from "@sap/artifact-management";
// import {} from "../../src/project-type/watcher";
// import { ProjectApiRead, SetContext } from "../../src/project-type/types";
// import {
//   ITEM,
//   MODULE,
//   PROJECT,
//   PROJECT_API_WRAPPER,
// } from "./project-struct-builders";
//
// describe("custom VSCode contexts using @sap/artifact-management tags", () => {
//   describe("watcher module", () => {
//     context("initProjectTypeWatchers()", () => {
//       context("project item changed", () => {
//         let inputProjectsAPIs: ProjectApiRead[];
//         const setContextArgs: { contextName: string; paths: string[] }[] = [];
//
//         const setContextMock: SetContext = (contextName, paths) => {
//           setContextArgs.push({ contextName, paths });
//         };
//
//         before(() => {
//           inputProjectsAPIs = PROJECT_API_WRAPPER([
//             PROJECT({
//               path: "/user/projects/A",
//               modules: [
//                 MODULE({
//                   path: "db",
//                   tags: ["AAA"],
//                   items: [
//                     ITEM({
//                       path: "db/teachers.csv",
//                       tags: ["AAA"],
//                     }),
//                   ],
//                 }),
//               ],
//               tags: ["AAA"],
//             }),
//             PROJECT({
//               path: "/user/root/B",
//               modules: [
//                 MODULE({
//                   path: "view",
//                   tags: ["BBB"],
//                   items: [
//                     ITEM({
//                       path: "view/index.html",
//                       tags: ["BBB"],
//                     }),
//                   ],
//                 }),
//               ],
//               tags: ["BBB"],
//             }),
//           ]);
//         });
//
//         it("will re-calculate **all** custom contexts on `updated` event", async () => {});
//
//         it("will debounce re-calculating custom contexts to reduce CPU load", async () => {});
//
//         after(() => {
//           // TODO: do we need cleanup?
//           //       probably yes...
//           //      maybe not if we use rewire?
//         });
//       });
//
//       context("workspace changed - project added", () => {
//         let inputProjectsAPIs: ProjectApiRead[];
//         const setContextArgs: { contextName: string; paths: string[] }[] = [];
//
//         const setContextMock: SetContext = (contextName, paths) => {
//           setContextArgs.push({ contextName, paths });
//         };
//
//         before(() => {
//           inputProjectsAPIs = PROJECT_API_WRAPPER([
//             PROJECT({
//               path: "/user/projects/A",
//               modules: [
//                 MODULE({
//                   path: "db",
//                   tags: ["AAA"],
//                   items: [
//                     ITEM({
//                       path: "db/teachers.csv",
//                       tags: ["AAA"],
//                     }),
//                   ],
//                 }),
//               ],
//               tags: ["AAA"],
//             }),
//             PROJECT({
//               path: "/user/root/B",
//               modules: [
//                 MODULE({
//                   path: "view",
//                   tags: ["BBB"],
//                   items: [
//                     ITEM({
//                       path: "view/index.html",
//                       tags: ["BBB"],
//                     }),
//                   ],
//                 }),
//               ],
//               tags: ["BBB"],
//             }),
//           ]);
//         });
//
//         it("will re-calculate **all** custom contexts on `workspaceChanged` event and update project listeners", async () => {});
//
//         after(() => {
//           // TODO: do we need cleanup?
//           //       probably yes...
//           //      maybe not if we use rewire?
//         });
//       });
//
//       context("workspace changed - project deleted", () => {
//         let inputProjectsAPIs: ProjectApiRead[];
//         const setContextArgs: { contextName: string; paths: string[] }[] = [];
//
//         const setContextMock: SetContext = (contextName, paths) => {
//           setContextArgs.push({ contextName, paths });
//         };
//
//         before(() => {
//           inputProjectsAPIs = PROJECT_API_WRAPPER([
//             PROJECT({
//               path: "/user/projects/A",
//               modules: [
//                 MODULE({
//                   path: "db",
//                   tags: ["AAA"],
//                   items: [
//                     ITEM({
//                       path: "db/teachers.csv",
//                       tags: ["AAA"],
//                     }),
//                   ],
//                 }),
//               ],
//               tags: ["AAA"],
//             }),
//             PROJECT({
//               path: "/user/root/B",
//               modules: [
//                 MODULE({
//                   path: "view",
//                   tags: ["BBB"],
//                   items: [
//                     ITEM({
//                       path: "view/index.html",
//                       tags: ["BBB"],
//                     }),
//                   ],
//                 }),
//               ],
//               tags: ["BBB"],
//             }),
//           ]);
//         });
//
//         it("will re-calculate **all** custom contexts on `workspaceChanged` event and update project listeners", async () => {});
//
//         after(() => {
//           // TODO: do we need cleanup?
//           //       probably yes...
//           //      maybe not if we use rewire?
//         });
//       });
//     });
//   });
// });
