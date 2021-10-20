import { Project, ProjectApi } from "@sap/artifact-management";
import {
  AbsolutePath,
  ProjectTypeTag,
  SetContext,
  TagToAbsPaths,
} from "./types";
import { forEach } from "lodash";
import { resolve } from "path";

/**
 * The in-memory representation of the our custom VSCode contexts
 * for the project Types (tags).
 */
const TAG_TO_ABS_PATHS_STATE: TagToAbsPaths = new Map();

// TODO: choose prefix...
const VSCODE_CONTEXT_PREFIX = "bas_project_types:";

/**
 * Resets and re-calculates the TagsContext data from scratch.
 * This trades performance for correctness, however, this calculation
 * is done purely in memory and is not very complex, therefore the
 * performance impact is none existent.
 *
 */
export async function recomputeTagsContexts(
  projects: ProjectApi[],
  setContext: SetContext
): Promise<void> {
  TAG_TO_ABS_PATHS_STATE.clear();
  // `for ... of` unlike `forEach` will resolve all the promises in this loop before
  // continuing to `refreshAllVSCodeContext()`
  for (const currProjectAPI of projects) {
    const currProjectDS = await currProjectAPI.read();
    if (currProjectDS !== undefined) {
      const tagToAbsPath = transformProjectApiToTagsMaps(currProjectDS);
      insertTagsData(TAG_TO_ABS_PATHS_STATE, tagToAbsPath);
    }
  }
  refreshAllVSCodeContext(TAG_TO_ABS_PATHS_STATE, setContext);
}

export function transformProjectApiToTagsMaps(project: Project): TagToAbsPaths {
  const tagToAbsPaths: TagToAbsPaths = new Map();
  try {
    const projectAbsRoot = project.path;
    insertPathForMultipleTags(
      tagToAbsPaths,
      projectAbsRoot,
      project.tags ?? []
    );
    forEach(project.modules, (currModule) => {
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
    // TODO: use logger
    console.error(e);
  }
  return tagToAbsPaths;
}

export function insertTagsData(
  target: TagToAbsPaths,
  newData: TagToAbsPaths
): void {
  // cannot use lodash on ES6 Maps
  newData.forEach((currtTagMap, currTagName) => {
    currtTagMap.forEach((_, currAbsPath) => {
      insertPathForSingleTag(target, currAbsPath, currTagName);
    });
  });
}

export function refreshAllVSCodeContext(
  tagToPaths: TagToAbsPaths,
  setContext: SetContext
): void {
  // cannot use lodash on ES6 Maps
  tagToPaths.forEach((currTagMap, currTagName) => {
    const paths = Array.from(currTagMap.keys());
    const currContextName = `${VSCODE_CONTEXT_PREFIX}${currTagName}`;
    setContext(currContextName, paths);
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
