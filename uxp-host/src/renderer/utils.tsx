import { DEFAULT_BACKGROUND } from "./constants";
import {
  adjectives,
  animals,
  colors,
  uniqueNamesGenerator,
} from "unique-names-generator";
import { v4 as uuid, v5 as uuidv5 } from "uuid";
import {
  getOutgoers,
  Node as FlowNode,
  Edge as FlowEdge,
} from "react-flow-renderer";
import { 
  // DEFAULT_COST, 
  DEFAULT_MAX_MINT_AMOUNT, NAMESPACE } from "./constants";
import { Configuration, ContractType, Instance } from "./typings";

const spacedNameConfiguration = {
  dictionaries: [colors, adjectives, animals],
  separator: " ",
  length: 2,
};

const dashedNameConfiguration = {
  dictionaries: [colors, adjectives, animals],
  separator: "-",
  length: 2,
};

export const spacedName = () => uniqueNamesGenerator(spacedNameConfiguration);

export const dashedName = () => uniqueNamesGenerator(dashedNameConfiguration);

export const getId = () => uuid();

export const capitalize = (string: string) =>
  string.charAt(0).toUpperCase() + string.slice(1);

export const chopAddress = (address: string) =>
  address.substring(0, 5) + "(...)" + address.substring(address.length - 3);

export const hash = (object: any): string =>
  uuidv5(JSON.stringify(object), NAMESPACE);

export const arrayDifference = <T,>(a: T[], b: T[]): T[] =>
  a.filter((x) => !b.includes(x));

export const chooseN = <T,>(a: T[], n: number): T[] =>
  [...a].sort(() => 0.5 - Math.random()).slice(0, n);

export const createConfiguration = (): Configuration => ({
  name: spacedName(),
  description: "Lorem ipsum",
  symbol: "LOREM",
  contractType: ContractType.ERC721,
  width: 500,
  height: 500,
  generateBackground: true,
  defaultBackground: DEFAULT_BACKGROUND,
  // cost: DEFAULT_COST,
  // maxMintAmount: DEFAULT_MAX_MINT_AMOUNT,
  layers: [] as string[],
});

export const createInstance = (): Instance => ({
  frozen: false,
  configuration: createConfiguration(),
  templates: [],
  generations: [],
});

export function getBranches(
  nodes: FlowNode[],
  edges: FlowEdge[]
): FlowNode[][] {
  const root = nodes.find((node) => node.type === "rootNode");

  const stack: {
    node: FlowNode;
    path: FlowNode[];
  }[] = [
    {
      node: root,
      path: [root],
    },
  ];

  const savedPaths = [];
  while (stack.length > 0) {
    const { node, path } = stack.pop();
    const neighbors = getOutgoers(node, nodes, edges);

    if (node.type === "renderNode") {
      savedPaths.push(path);
    } else {
      for (const neighbor of neighbors) {
        stack.push({
          node: neighbor,
          path: [...path, neighbor],
        });
      }
    }
  }

  return savedPaths;
}
