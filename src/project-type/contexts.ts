/* eslint-disable @typescript-eslint/no-unsafe-assignment*/
import { commands } from "vscode";
import { forEach } from "lodash"

export type ProjectTypeTags = string;
type absolutePath = string;

const projectsTypeMap: Map<ProjectTypeTags, Map<absolutePath, boolean>> = new Map();

export function insertToProjectTypeMaps(absFsPath: string, tags: ProjectTypeTags[]): void {
    forEach(tags, (currTag) => {
        if (!projectsTypeMap.has(currTag) ) {
            projectsTypeMap.set(currTag, new Map());
        }

        const typeMap = projectsTypeMap.get(currTag) as Map<absolutePath, boolean>;
        typeMap.set(absFsPath, true);

        const typeMapKeys = Array.from(typeMap.keys());
        void commands.executeCommand(
            'setContext',
            `bas_project_types:${currTag}`,
            typeMapKeys
        );
    })
}
