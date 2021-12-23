import { forEach } from "lodash";
import { join, normalize } from "path";
import { Project } from "@sap/artifact-management";
import { IChildLogger } from "@vscode-logging/types";
import {
  SapProjectType,
  TagKey,
  VSCodeContextSeparator,
} from "@sap-devx/app-studio-toolkit-types";
import {
  AbsolutePath,
  ProjectApiRead,
  SetContext,
  TagToAbsPaths,
} from "./types";
// TODO: this only works in custom-context-spec.ts due to previous tests globally mocking vscode
//   STABILITY DEPENDS OO TEST FILES LOADING ORDER?!!!?!
import { getLogger } from "../logger/logger";

let logger: IChildLogger;
function getComponentLogger(): IChildLogger {
  logger = logger || getLogger().getChildLogger({ label: "custom-context" });
  return logger;
}

const VSCODE_CONTEXT_PREFIX: `${SapProjectType}${VSCodeContextSeparator}` =
  "sapProjectType:";

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
    (project.tags as TagKey[]) ?? []
  );
  forEach(project.modules, (currModule) => {
    // `Module["path"]` is relative to the project's root
    const moduleAbsPath = join(projectAbsRoot, currModule.path);
    insertPathForMultipleTags(
      tagToAbsPaths,
      moduleAbsPath,
      /* istanbul ignore next -- tags is (strangely) marked as optional */
      (currModule.tags as TagKey[]) ?? []
    );
    forEach(currModule.items, (currItem) => {
      // `Item["path"]` is also relative to the project's root
      const itemAbsPath = join(projectAbsRoot, currItem.path);
      insertPathForMultipleTags(
        tagToAbsPaths,
        itemAbsPath,
        /* istanbul ignore next -- tags is (strangely) marked as optional */
        (currItem.tags as TagKey[]) ?? []
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
  tagToAbsPaths: TagToAbsPaths,
  setContext: SetContext
): void {
  // cannot use lodash on ES6 Maps
  tagToAbsPaths.forEach((currTagMap, currTagName) => {
    const paths = Array.from(currTagMap.keys());
    const currContextName = `${VSCODE_CONTEXT_PREFIX}${currTagName}`;
    setContext(currContextName, paths);
    getComponentLogger().debug(
      `context recalculated`,
      { contextName: currContextName },
      { paths: paths }
    );
  });
}

export function insertPathForMultipleTags(
  tagToAbsPath: TagToAbsPaths,
  absFsPath: AbsolutePath,
  tags: TagKey[]
): void {
  forEach(tags, (currTag) => {
    insertPathForSingleTag(tagToAbsPath, absFsPath, currTag);
  });
}

export function insertPathForSingleTag(
  tagToAbsPath: TagToAbsPaths,
  absFsPath: AbsolutePath,
  tag: TagKey
): void {
  if (!tagToAbsPath.has(tag)) {
    tagToAbsPath.set(tag, new Map());
  }

  const tagMap = tagToAbsPath.get(tag)!;
  tagMap.set(absFsPath, true);

  const windowsLikeAbsPath = buildWinLikePath(absFsPath);
  tagMap.set(windowsLikeAbsPath, true);
}

// hacky workaround
// TODO: document this hack and the reasons behind it and how it works
function buildWinLikePath(input: string): string {
  const withBackSlash = input.replace(/\//g, "\\");
  return withBackSlash;
}
