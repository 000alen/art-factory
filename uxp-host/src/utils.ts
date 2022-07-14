import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import imageSize from "image-size";
import path from "path";
import { Edge as FlowEdge, getOutgoers, Node as FlowNode } from "react-flow-renderer";
import sharp from "sharp";
import solc from "solc";
import { v5 as uuidv5 } from "uuid";

import { NAMESPACE, RARITY_DELIMITER } from "./constants";
import { getInfuraProjectId } from "./store";
import { BundlesInfo, Network, Trait } from "./typings";

export function rarity(elementName: string) {
  let rarity = Number(elementName.split(RARITY_DELIMITER).pop());
  if (isNaN(rarity)) rarity = 1;
  return rarity;
}

export function removeRarity(elementName: string) {
  return elementName.split(RARITY_DELIMITER).shift();
}

export function append(a: any[], b: any[]) {
  return a.map((a_i, i) => [...a_i, ...b[i]]);
}

export function layersNames(inputDir: string) {
  return fs.readdirSync(inputDir).filter((file) => !file.startsWith("."));
}

export const capitalize = (string: string) =>
  string.charAt(0).toUpperCase() + string.slice(1);

export const readDir = async (dir: string): Promise<string[]> =>
  (await fs.promises.readdir(dir)).filter((file) => !file.startsWith("."));

export function choose(
  traits: Trait[],
  randomFunction = Math.random,
  temperature = 50,
  influence = 2
): Trait {
  const T = (temperature - 50) / 50;
  const n = traits.length;
  if (!n) return null;

  const total = traits.reduce(
    (previousTotal, element) => previousTotal + element.rarity,
    0
  );

  const average = total / n;

  const urgencies: Record<string, number> = {};
  const urgencySum = traits.reduce((previousSum, element) => {
    const { value, rarity } = element;
    let urgency = rarity + T * influence * (average - rarity);
    if (urgency < 0) urgency = 0;
    urgencies[value] = (urgencies[value] || 0) + urgency;
    return previousSum + urgency;
  }, 0);

  let currentUrgency = 0;
  const cumulatedUrgencies: Record<string, number> = {};
  Object.keys(urgencies).forEach((id) => {
    currentUrgency += urgencies[id];
    cumulatedUrgencies[id] = currentUrgency;
  });

  if (urgencySum <= 0) return null;

  const choice = randomFunction() * urgencySum;
  const values = Object.keys(cumulatedUrgencies);
  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    const urgency = cumulatedUrgencies[value];
    if (choice <= urgency) {
      return traits.find((trait) => trait.value === value);
    }
  }
}

export async function pinDirectoryToIPFS(
  pinataApiKey: string,
  pinataSecretApiKey: string,
  src: string
): Promise<{
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}> {
  const url = "https://api.pinata.cloud/pinning/pinFileToIPFS";
  const base = path.parse(src).base;

  const data = new FormData();
  (await readDir(src)).forEach((file) => {
    data.append("file", fs.createReadStream(path.join(src, file)), {
      filepath: path.join(base, path.parse(file).base),
    });
  });

  return axios
    .post(url, data, {
      // @ts-ignore
      maxBodyLength: "Infinity",
      headers: {
        // @ts-ignore
        "Content-Type": `multipart/form-data; boundary=${data._boundary}`,
        pinata_api_key: pinataApiKey,
        pinata_secret_api_key: pinataSecretApiKey,
      },
    })
    .then((response) => response.data);
}

export async function pinFileToIPFS(
  pinataApiKey: string,
  pinataSecretApiKey: string,
  src: string
): Promise<{
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}> {
  const url = "https://api.pinata.cloud/pinning/pinFileToIPFS";

  const data = new FormData();
  data.append("file", fs.createReadStream(src));

  return axios
    .post(url, data, {
      // @ts-ignore
      maxBodyLength: "Infinity",
      headers: {
        // @ts-ignore
        "Content-Type": `multipart/form-data; boundary=${data._boundary}`,
        pinata_api_key: pinataApiKey,
        pinata_secret_api_key: pinataSecretApiKey,
      },
    })
    .then((response) => response.data);
}

export async function restrictImage(buffer: Buffer, maxSize?: number) {
  if (maxSize) {
    let { width, height } = imageSize(buffer);
    const ratio = Math.max(width, height) / maxSize;
    if (ratio > 1) {
      width = Math.floor(width / ratio);
      height = Math.floor(height / ratio);
      buffer = await sharp(buffer).resize(width, height).png().toBuffer();
    }
  }
  return buffer;
}

export function replaceAll(
  str: string,
  find: string | RegExp,
  replace: string
) {
  return str.replace(new RegExp(find, "g"), replace);
}

export const hash = (object: any): string =>
  uuidv5(JSON.stringify(object), NAMESPACE);

export async function getContract(name: string) {
  const content = await fs.promises.readFile(
    path.join(__dirname, "contracts", `${name}.sol`),
    {
      encoding: "utf8",
    }
  );
  const input = {
    language: "Solidity",
    sources: {
      [name]: {
        content,
      },
    },
    settings: {
      outputSelection: {
        "*": {
          "*": ["*"],
        },
      },
    },
  };
  return JSON.parse(solc.compile(JSON.stringify(input)));
}

export async function getContractSource(name) {
  await fs.promises.readFile(path.join(__dirname, "contracts", `${name}.sol`), {
    encoding: "utf8",
  });
}

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

export const arrayDifference = <T>(a: T[], b: T[]): T[] =>
  a.filter((x) => !b.includes(x));

export const getInfuraEndpoint = (network: Network) =>
  network === "main"
    ? `https://mainnet.infura.io/v3/${getInfuraProjectId()}`
    : `https://rinkeby.infura.io/v3/${getInfuraProjectId()}`;

export const computeTraitsNs = (
  _nTraits: Trait[][],
  _branchesNs: Record<string, number>,
  keys: string[]
): Record<string, number> => {
  const traitsNs: Record<string, number> = {};
  for (let [index, traits] of _nTraits.entries()) {
    const n = _branchesNs[keys[index]];
    for (const { id } of traits)
      if (!(id in traitsNs) || n > traitsNs[id]) traitsNs[id] = n;
  }
  return traitsNs;
};

export const computeBundlesNs = (
  _bundlesInfo: BundlesInfo,
  _branchesNs: Record<string, number>
): Record<string, number> => {
  const bundlesNs: Record<string, number> = {};
  for (const { name, ids } of _bundlesInfo)
    bundlesNs[name] = Math.min(...ids.map((id) => _branchesNs[id]));
  return bundlesNs;
};

