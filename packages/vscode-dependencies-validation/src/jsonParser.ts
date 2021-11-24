import { Point } from "unist";
import { NPMDependencyIssue } from "@sap-devx/npm-dependencies-validation";
import { filter, find, map, compact } from "lodash";
import { parseTree, Node } from "jsonc-parser";
import * as vfile from "vfile";
import * as vfileLocation from "vfile-location";

const DEPENDENCIES = "dependencies";
const DEV_DEPENDENCIES = "devDependencies";

export type DependencyIssueLocation = {
  keyPoint: Point | undefined;
  valuePoint: Point | undefined;
  npmDepIssue: NPMDependencyIssue;
};

export function getDepIssueLocations(
  pkgJsonText: string,
  npmDependencyIssues: NPMDependencyIssue[]
): DependencyIssueLocation[] {
  // TODO: pass options (errors/no comments/other?)
  const tree = parseTree(pkgJsonText);

  if (tree?.type !== "object") return []; // JSON top level is not an object

  const virtualPkgJsonFile: vfile.VFile = vfile(pkgJsonText);

  const depIssueLocations = createDepIssueLocations(
    tree,
    DEPENDENCIES,
    npmDependencyIssues,
    virtualPkgJsonFile
  );

  const devDepIssueLocations = createDepIssueLocations(
    tree,
    DEV_DEPENDENCIES,
    npmDependencyIssues,
    virtualPkgJsonFile
  );

  return depIssueLocations.concat(devDepIssueLocations);
}

function getNodeByPropertyName(
  tree: Node,
  propertyName: string
): Node | undefined {
  return find(
    tree.children,
    (node) => node?.children?.[0].value === propertyName
  );
}

function filterNPMDepsIssues(
  npmDependencyIssues: NPMDependencyIssue[],
  propName: string
): NPMDependencyIssue[] {
  const devDeps = propName === DEV_DEPENDENCIES ? true : false;
  return filter(
    npmDependencyIssues,
    (npmDepIssue) => npmDepIssue.devDependency === devDeps
  );
}

function getNodeValues(node: Node | undefined): Node[] {
  return node?.children?.[1].children || [];
}

function createDepIssueLocations(
  tree: Node,
  depIssuesPropName: string,
  npmDependencyIssues: NPMDependencyIssue[],
  virtualPkgJsonFile: vfile.VFile
): DependencyIssueLocation[] {
  const depNode = getNodeByPropertyName(tree, depIssuesPropName);
  const depPropNodes = getNodeValues(depNode);
  const npmDepIssues = filterNPMDepsIssues(
    npmDependencyIssues,
    depIssuesPropName
  );
  return findIssuesLocations(npmDepIssues, depPropNodes, virtualPkgJsonFile);
}

function findIssuesLocations(
  npmDepIssues: NPMDependencyIssue[],
  depPropNodes: Node[] | undefined,
  virtualPkgJsonFile: vfile.VFile
): DependencyIssueLocation[] {
  return compact(
    map(npmDepIssues, (npmDepIssue) => {
      const { name } = npmDepIssue;
      const depPropNodeWithIssue = find(
        depPropNodes,
        (depPropNode) => depPropNode?.children?.[0].value === name
      );
      if (depPropNodeWithIssue) {
        const keyOffset: number | undefined =
          depPropNodeWithIssue?.children?.[0].offset;
        const keyPoint = keyOffset
          ? getPoint(virtualPkgJsonFile, keyOffset)
          : undefined;

        const valueOffset: number | undefined =
          depPropNodeWithIssue?.children?.[1].offset;
        const valuePoint = valueOffset
          ? getPoint(virtualPkgJsonFile, valueOffset)
          : undefined;

        return { keyPoint, valuePoint, npmDepIssue };
      }
    })
  );
}

function getPoint(
  virtualPkgJsonFile: vfile.VFile,
  nodeOffset: number
): Required<Point> {
  return vfileLocation(virtualPkgJsonFile).toPoint(nodeOffset);
}
