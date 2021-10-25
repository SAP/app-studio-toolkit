// utilities for concise building of @sap/artifact-management structures
import { Item, Module, Project } from "@sap/artifact-management";
import { basename } from "path";
import { ProjectApiRead } from "../../src/project-type/types";
import { map } from "lodash";

export function PROJECT(
  opts: Omit<Project, "cloudService" | "prefix" | "type" | "name">
): Project {
  return {
    name: basename(opts.path),
    ...opts,
    cloudService: "N/A",
    prefix: "N/A",
    type: "N/A",
  };
}

export function MODULE(opts: Omit<Module, "type" | "name">): Module {
  return {
    name: basename(opts.path),
    ...opts,
    type: "N/A",
  };
}

export function ITEM(opts: Omit<Item, "type" | "ref" | "name">): Item {
  return {
    name: basename(opts.path),
    ...opts,
    type: "N/A",
    ref: "N/A",
  };
}

export function PROJECT_API_WRAPPER(projects: Project[]): ProjectApiRead[] {
  // eslint-disable-next-line  @typescript-eslint/require-await -- too strict linting for tests, may need to evaluate disabling this rule in `test` folder.
  return map(projects, (_) => ({ read: async () => _ }));
}
