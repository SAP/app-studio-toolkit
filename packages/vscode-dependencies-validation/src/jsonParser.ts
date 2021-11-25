import { Point } from "unist";
import {
  NPMDependencyIssue,
  filterDependencyIssues,
  DependenciesPropertyName,
} from "@sap-devx/npm-dependencies-validation";
import { map, compact } from "lodash";
import { parseTree, Node, findNodeAtLocation } from "jsonc-parser";
import * as vfile from "vfile";
import * as vfileLocation from "vfile-location";

export type DependencyIssueLocation = {
  namePoint: Point;
  versionPoint: Point;
  actualVersion: string;
  npmDepIssue: NPMDependencyIssue;
};

// creates dependency issues name and version points
export function getDepIssueLocations(
  packageJsonContent: string,
  npmDependencyIssues: NPMDependencyIssue[]
): DependencyIssueLocation[] {
  // TODO: pass options (errors/no comments/other?)
  const tree = parseTree(packageJsonContent);

  if (tree?.type !== "object") return []; // JSON top level is not an object

  const virtualPkgJsonFile: vfile.VFile = vfile(packageJsonContent);

  const depsPropNames: DependenciesPropertyName[] = [
    "dependencies",
    "devDependencies",
  ];
  const [depIssueLocations, devDepIssueLocations] = depsPropNames.map(
    (depsPropName) => {
      return createDepIssueLocations(
        tree,
        depsPropName,
        npmDependencyIssues,
        virtualPkgJsonFile
      );
    }
  );

  return [...depIssueLocations, ...devDepIssueLocations];
}

function createDepIssueLocations(
  tree: Node,
  depsPropName: DependenciesPropertyName,
  npmDependencyIssues: NPMDependencyIssue[],
  virtualPkgJsonFile: vfile.VFile
): DependencyIssueLocation[] {
  // dependencies or devDependencies node
  const depIssues = filterDependencyIssues(npmDependencyIssues, depsPropName);
  return compact(
    map(depIssues, (npmDepIssue) => {
      return createIssueLocation(
        tree,
        npmDepIssue,
        depsPropName,
        virtualPkgJsonFile
      );
    })
  );
}

function createIssueLocation(
  tree: Node,
  npmDepIssue: NPMDependencyIssue,
  depsPropName: DependenciesPropertyName,
  vPackageJsonFile: vfile.VFile
): DependencyIssueLocation | undefined {
  const { name } = npmDepIssue;
  const versionNode = findNodeAtLocation(tree, [depsPropName, name]);
  const nameNode = versionNode?.parent?.children?.[0];
  if (nameNode) {
    const nameOffset = nameNode.offset;
    const namePoint = createPoint(vPackageJsonFile, nameOffset);
    const versionOffset = versionNode.offset;
    const versionPoint = createPoint(vPackageJsonFile, versionOffset);

    return {
      namePoint,
      versionPoint,
      npmDepIssue,
      actualVersion: versionNode.value,
    };
  }
}

function createPoint(
  virtualPkgJsonFile: vfile.VFile,
  nodeOffset: number
): Required<Point> {
  return vfileLocation(virtualPkgJsonFile).toPoint(nodeOffset);
}
