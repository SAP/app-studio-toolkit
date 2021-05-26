/* eslint-disable @typescript-eslint/no-unsafe-assignment*/
import { commands } from "vscode";

export type ProjectType = string;
type absolutePath = string;

const projectsTypeMap: Map<ProjectType, Map<absolutePath, boolean>> = new Map();

export function insertToProjectTypeMaps(absFsPath: string, type: ProjectType): void {
    if (!projectsTypeMap.has(type) ) {
        projectsTypeMap.set(type, new Map());
    }

    const typeMap = projectsTypeMap.get(type) as Map<absolutePath, boolean>;
    typeMap.set(absFsPath, true);

    const typeMapKeys = Array.from(typeMap.keys());
    void commands.executeCommand(
        'setContext',
        `bas_project_types:${type}`,
        typeMapKeys
    );
}
