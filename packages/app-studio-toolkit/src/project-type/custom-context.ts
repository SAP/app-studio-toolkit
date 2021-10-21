import { forEach } from "lodash";
import { join, normalize } from "path";
import { Project, ProjectApi } from "@sap/artifact-management";
import {
  AbsolutePath,
  ProjectApiRead,
  ProjectTypeTag,
  SetContext,
  TagToAbsPaths,
} from "./types";

// TODO: choose prefix...
const VSCODE_CONTEXT_PREFIX = "bas_project_types:";

/**
 * Fully re-calculates the TagsContext data from scratch.
 * This trades performance for correctness, however, this calculation
 * is done purely in memory and is not very complex, therefore the
 * performance impact is none existent.
 *
 */
export async function recomputeTagsContexts(
  projects: ProjectApiRead[],
  setContext: SetContext
): Promise<void> {
  const tagsToPaths: TagToAbsPaths = new Map();
  // `for ... of` unlike `forEach` will resolve all the promises in this loop before
  // continuing to `refreshAllVSCodeContext()`
  for (const currProjectAPI of projects) {
    const currProjectDS = await currProjectAPI.read();
    /* istanbul ignore else -- uncertain in what situation `read()` would return `undefined` */
    if (currProjectDS !== undefined) {
      const tagToAbsPath = transformProjectApiToTagsMaps(currProjectDS);
      insertTagsData(tagsToPaths, tagToAbsPath);
    }
  }
  refreshAllVSCodeContext(tagsToPaths, setContext);
}

export function transformProjectApiToTagsMaps(project: Project): TagToAbsPaths {
  const tagToAbsPaths: TagToAbsPaths = new Map();
  // ensures `project.path` uses the correct OS dir separator
  const projectAbsRoot = normalize(project.path);
  insertPathForMultipleTags(
    tagToAbsPaths,
    projectAbsRoot,
    /* istanbul ignore next -- tags is (strangely) marked as optional */
    project.tags ?? []
  );
  forEach(project.modules, (currModule) => {
    // `Module["path"]` is relative to the project's root
    const moduleAbsPath = join(projectAbsRoot, currModule.path);
    insertPathForMultipleTags(
      tagToAbsPaths,
      moduleAbsPath,
      /* istanbul ignore next -- tags is (strangely) marked as optional */
      currModule.tags ?? []
    );
    forEach(currModule.items, (currItem) => {
      // `Item["path"]` is also relative to the project's root
      const itemAbsPath = join(projectAbsRoot, currItem.path);
      insertPathForMultipleTags(
        tagToAbsPaths,
        itemAbsPath,
        /* istanbul ignore next -- tags is (strangely) marked as optional */
        currItem.tags ?? []
      );
    });
  });
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
