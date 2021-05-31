import * as fs from "fs";
const { readdir } = fs.promises;
import { resolve } from "path";
import { workspace } from "vscode";
import { filter, map, forEach } from "lodash";
import {insertToProjectTypeMaps, ProjectType} from "./contexts";
// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-var-requires
const ProjectImpl = require("@ext-lcapvsc-npm-dev/lcap-project-api/dist/src/project-api/ProjectImpl");


export async function initWorkspaceProjectTypeContexts(): Promise<void> {
    const wsRoot = workspace.rootPath as string;
    const wsSubDirs = await getSubDirs(wsRoot);
    forEach(wsSubDirs, async (dirName) => {
        const absDirName = resolve(wsRoot, dirName);
        const projTypesForDir = await readProjectTypesForDir(wsRoot);
        forEach(projTypesForDir, (projType) => {
            insertToProjectTypeMaps(absDirName, projType);
        });
    });
}

async function getSubDirs(dir:string): Promise<string[]> {
    const dirents = await readdir(dir, {withFileTypes: true});
    const subDirs = filter(dirents, _ => _.isDirectory());
    const subDirNames = map(subDirs, _ => _.name);
    return subDirNames;
}

async function readProjectTypesForDir(dirPath:string): Promise<ProjectType[]> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call
    const projectApi = new ProjectImpl.default(dirPath, true);
    try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
        const api = await projectApi.read(undefined);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-member-access
        return api.tags;
    }
    catch (e) {
        console.error(e);
    }
    projectApi.tagAddedHandler((newTags) => { /*  ... */})
    projectApi.tagRemovedHandled((removedTags) => { /* ... */})

    return [];
}
