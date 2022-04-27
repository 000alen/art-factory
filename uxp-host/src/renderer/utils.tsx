import { Edge as FlowEdge, getOutgoers, Node as FlowNode } from "react-flow-renderer";
import { adjectives, animals, colors, uniqueNamesGenerator } from "unique-names-generator";
import { v4 as uuid, v5 as uuidv5 } from "uuid";

import { DEFAULT_BACKGROUND, NAMESPACE, RARITY_DELIMITER } from "./constants";
import { Configuration, ContractType, Instance, SourceItem } from "./typings";

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

export function rarity(elementName: string) {
  let rarity = Number(elementName.split(RARITY_DELIMITER).pop());
  if (isNaN(rarity)) rarity = 1;
  return rarity;
}

export function removeRarity(elementName: string) {
  return elementName.split(RARITY_DELIMITER).shift();
}

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
  layers: [] as string[],
});

export const createInstance = (): Instance => ({
  frozen: false,
  configuration: createConfiguration(),
  templates: [],
  generations: [],
  sources: [],
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

export const makeSource = (
  name: string,
  partialItems: Partial<SourceItem>[]
) => ({
  name,
  items: partialItems.map(({ name, photoshopTraitLayer }) => ({
    photoshopTraitLayer,
    name,
    value: removeRarity(photoshopTraitLayer),
  })),
});
