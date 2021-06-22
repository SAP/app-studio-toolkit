import { ProjectApi, WorkspaceApi } from "@sap/project-api";
import { AbsolutePath, ProjectTypeTag, TagToAbsPaths } from "./types";
import { commands } from "vscode";
import { forEach } from "lodash";
import { resolve } from "path";

/**
 * The in-memory representation of the our custom VSCode contexts
 * for te project Types (tags).
 */
const GLOBAL_TAG_TO_ABS_PATHS: TagToAbsPaths = new Map();

export function insertTagsData(newData: TagToAbsPaths): void {
  newData.forEach((currtTagMap, currTagName) => {
    currtTagMap.forEach((_, currAbsPath) => {
      insertPathForSingleTag(GLOBAL_TAG_TO_ABS_PATHS, currAbsPath, currTagName);
    });
  });

  refreshAllVSCodeContext();
}

/**
 * note that the `purging` logic assumes there are no items
 * which belong to multiple projects. In other words a single `absPath` can
 * only be part of a **single** project.
 */
export function purgeTagsData(deadData: TagToAbsPaths): void {
  deadData.forEach((currtTagMap, currTagName) => {
    if (GLOBAL_TAG_TO_ABS_PATHS.has(currTagName)) {
      currtTagMap.forEach((_, currAbsPath) => {
        GLOBAL_TAG_TO_ABS_PATHS.delete(currAbsPath);
      });
    }
  });

  refreshAllVSCodeContext();
}

// TODO: consider Dependency Injection to enable easier testing
export function refreshAllVSCodeContext(): void {
  GLOBAL_TAG_TO_ABS_PATHS.forEach((currtTagMap, currTagName) => {
    const paths = Array.from(currtTagMap.keys());
    void commands.executeCommand(
      "setContext",
      // TODO: do we want to use `bas_project_types` as the prefix or something else?
      `bas_project_types:${currTagName}`,
      paths
    );
  });
}

export async function initTagsContexts(workspaceAPI: WorkspaceApi): Promise<void> {
  let allProjectsAPI: ProjectApi[] = [];
  try {
    allProjectsAPI = await workspaceAPI.getProjects();
  } catch (e) {
    console.error(e);
  }

  forEach(allProjectsAPI, async (currProjectAPI) => {
    const tagToAbsPath = await transformProjectApiToTagsMaps(currProjectAPI);
    insertTagsData(tagToAbsPath);
  });
}

export function insertPathForMultipleTags(
  tagToAbsPath: TagToAbsPaths,
  absFsPath: AbsolutePath,
  tags: ProjectTypeTag[]
): void {
  forEach(tags, (currTag) => {
    insertPathForSingleTag(tagToAbsPath, absFsPath, currTag);
  });
}

export function insertPathForSingleTag(
  tagToAbsPath: TagToAbsPaths,
  absFsPath: AbsolutePath,
  tag: ProjectTypeTag
): void {
  if (!tagToAbsPath.has(tag)) {
    tagToAbsPath.set(tag, new Map());
  }

  const tagMap = tagToAbsPath.get(tag) as Map<AbsolutePath, boolean>;
  tagMap.set(absFsPath, true);
}

export async function transformProjectApiToTagsMaps(
  projAPI: ProjectApi
): Promise<TagToAbsPaths> {
  const tagToAbsPaths: TagToAbsPaths = new Map();
  try {
    const currProjectDS = await projAPI.read();
    if (currProjectDS === undefined) {
      return tagToAbsPaths;
    }
    const projectAbsRoot = currProjectDS.path;
    insertPathForMultipleTags(
      tagToAbsPaths,
      projectAbsRoot,
      currProjectDS.tags ?? []
    );
    forEach(currProjectDS.modules, (currModule) => {
      // `Module["path"]` is relative to the project's root
      const moduleAbsPath = resolve(projectAbsRoot, currModule.path);
      insertPathForMultipleTags(
        tagToAbsPaths,
        moduleAbsPath,
        currModule.tags ?? []
      );
      forEach(currModule.items, (currItem) => {
        // `Item["path"]` is also relative to the project's root
        const itemAbsPath = resolve(projectAbsRoot, currItem.path);
        insertPathForMultipleTags(
          tagToAbsPaths,
          itemAbsPath,
          currItem.tags ?? []
        );
      });
    });
  } catch (e) {
    console.error(e);
  }
  return tagToAbsPaths;
}
