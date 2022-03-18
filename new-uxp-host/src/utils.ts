import Jimp from "jimp";
import path from "path";
import axios from "axios";
import fs from "fs";
import FormData from "form-data";
import { getOutgoers } from "react-flow-renderer";
import { tuple } from "immutable-tuple";
import { v4 as uuid } from "uuid";
import imageSize from "image-size";
import {
  Configuration,
  Layer,
  RenderNodeData,
  LayerNodeData,
  LayerNode,
  RenderNode,
  Element,
} from "./typings";

export const RARITY_DELIMITER = "#";

export function randomColor() {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  const a = 255;

  return Jimp.rgbaToInt(r, g, b, a);
}

export function rarity(elementName: string) {
  let rarity = Number(elementName.split(RARITY_DELIMITER).pop());
  if (isNaN(rarity)) rarity = 1;
  return rarity;
}

export function removeRarity(elementName: string) {
  return elementName.split(RARITY_DELIMITER).shift();
}

// ! TODO: Rewrite
// Source: https://github.com/parmentf/random-weighted-choice
export function rarityWeightedChoice(
  layerElements: Layer[],
  temperature = 50,
  randomFunction = Math.random,
  influence = 2
) {
  const T = (temperature - 50) / 50;
  const nb = layerElements.length;
  if (!nb) return null;

  const total = layerElements.reduce(
    (previousTotal, element) => previousTotal + element.rarity,
    0
  );

  const avg = total / nb;

  const ur = {};
  const urgencySum = layerElements.reduce((previousSum, element) => {
    const { name, rarity } = element;
    let urgency = rarity + T * influence * (avg - rarity);
    if (urgency < 0) urgency = 0;
    // @ts-ignore
    ur[name] = (ur[name] || 0) + urgency;
    return previousSum + urgency;
  }, 0);

  let currentUrgency = 0;
  const cumulatedUrgencies = {};
  Object.keys(ur).forEach((id) => {
    // @ts-ignore
    currentUrgency += ur[id];
    // @ts-ignore
    cumulatedUrgencies[id] = currentUrgency;
  });

  if (urgencySum <= 0) return null;

  const choice = randomFunction() * urgencySum;
  const names = Object.keys(cumulatedUrgencies);
  const rarities = layerElements.map((element) => element.rarity);
  const types = layerElements.map((element) => element.type);
  const blendings = layerElements.map((element) => element.blending);
  const opacities = layerElements.map((element) => element.opacity);
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    // @ts-ignore
    const urgency = cumulatedUrgencies[name];
    if (choice <= urgency) {
      return {
        name,
        rarity: rarities[i],
        type: types[i],
        blending: blendings[i],
        opacity: opacities[i],
      };
    }
  }
}

// Source: https://docs.pinata.cloud/api-pinning/pin-file
// {
//   IpfsHash: This is the IPFS multi-hash provided back for your content,
//   PinSize: This is how large (in bytes) the content you just pinned is,
//   Timestamp: This is the timestamp for your content pinning (represented in ISO 8601 format)
// }
export async function pinDirectoryToIPFS(
  pinataApiKey: string,
  pinataSecretApiKey: string,
  src: string
) {
  const url = "https://api.pinata.cloud/pinning/pinFileToIPFS";
  const base = path.parse(src).base;

  const data = new FormData();
  (await fs.promises.readdir(src))
    .filter((file) => !file.startsWith("."))
    .forEach((file) => {
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

export function pinFileToIPFS(
  pinataApiKey: string,
  pinataSecretApiKey: string,
  src: string
) {
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

// ! TODO
// Source: https://docs.etherscan.io/tutorials/verifying-contracts-programmatically
export function verifyContract(
  apiKey: string,
  sourceCode: string,
  network: string,
  contractaddress: string,
  codeformat: string,
  contractname: string,
  compilerversion: string,
  optimizationUsed: number
) {
  const urls = {
    mainnet: "https://api.etherscan.io/api",
    ropsten: "https://api-ropsten.etherscan.io/api",
    rinkeby: "https://api-rinkeby.etherscan.io/api",
  };
  // @ts-ignore
  const url = urls[network];

  return axios
    .post(url, {
      module: "contract",
      action: "verify",
      contractaddress,
      sourceCode,
      codeformat,
      contractname,
      compilerversion,
      optimizationUsed,
      apikey: apiKey,
    })
    .then((response) => response.data);
}

export function getPaths(elements: Element[]) {
  const root = elements
    .filter((element) => element.type === "rootNode")
    .shift();

  const stack = [
    {
      node: root,
      path: [root],
    },
  ];

  const savedPaths = [];
  while (stack.length > 0) {
    const actualNode = stack.pop();
    // @ts-ignore
    const neighbors = getOutgoers(actualNode.node, elements);

    // Leaf node
    if (neighbors.length === 0 && actualNode.node.type === "renderNode")
      savedPaths.push(actualNode.path);

    for (const v of neighbors) {
      stack.push({
        // @ts-ignore
        node: v,
        // @ts-ignore
        path: [...actualNode.path, v],
      });
    }
  }

  return savedPaths;
}

export function getPrefixes(
  paths: (LayerNodeData | RenderNodeData)[][]
): (LayerNode | RenderNode)[][] {
  const prefixes = new Set();

  for (const path of paths) {
    const filteredPaths = paths.filter(
      // @ts-ignore
      (_path) => _path[0].layer === path[0].layer
    );
    const subPaths = filteredPaths.map((_path) => _path.slice(1));

    if (subPaths.length > 1) {
      prefixes.add(tuple(path[0]));

      const subPrefixes = getPrefixes(subPaths);

      for (const subPrefix of subPrefixes) {
        prefixes.add(tuple(path[0], ...subPrefix));
      }
    }
  }

  // @ts-ignore
  return [...prefixes].map((prefix) => [...prefix]);
}

export function reducePaths(paths: (LayerNodeData | RenderNodeData)[][]) {
  const cache = new Map();

  // let i = 0;
  while (true) {
    const id = uuid();
    const prefixes = getPrefixes(paths)
      .map((prefix) => {
        if (prefix.length === 1 && cache.has(prefix[0].id)) return null;
        return prefix;
      })
      .filter((prefix) => prefix !== null)
      .sort((a, b) => a.length - b.length);

    const prefix = prefixes[0];

    if (prefix === undefined) break;

    cache.set(id, prefix);

    // @ts-ignore
    paths = paths.map((path) => {
      const _path = path.map((node) => {
        if ("layer" in node) {
          return node.layer;
        } else if ("id" in node) {
          // @ts-ignore
          return node.id;
        } else {
          return node;
        }
      });
      const _prefix = prefix.map((node) => {
        if ("layer" in node) {
          // @ts-ignore
          return node.layer;
        } else if ("id" in node) {
          return node.id;
        } else {
          return node;
        }
      });

      return tuple(..._path.slice(0, _prefix.length)) === tuple(..._prefix)
        ? [{ id }, ...path.slice(_prefix.length)]
        : path;
    });

    // if (i++ > 1) break;
  }

  return [cache, paths];
}

export function computeNs(
  cache: Map<string, (LayerNodeData | RenderNodeData)[]>,
  paths: (LayerNodeData | RenderNodeData)[][]
) {
  const ns = new Map();

  for (const [id, cachedPath] of cache) {
    let n = paths
      // @ts-ignore
      .filter((path) => path.find((p) => p.id === id))
      // @ts-ignore
      .map((path) => path[path.length - 1].n)
      .reduce((a, b) => Math.max(a, b), 0);

    n = Math.max(ns.has(id) ? ns.get(id) : 0, n);
    const stack = [id];
    while (stack.length > 0) {
      const current = stack.pop();
      if (!ns.has(current) || ns.get(current) < n) ns.set(current, n);
      for (const v of cache.get(current)) {
        // @ts-ignore
        if ("id" in v && ns.has(v.id)) stack.push(v.id);
      }
    }
  }

  return ns;
}

export function expandPathIfNeeded(
  cache: Map<string, (LayerNodeData | RenderNodeData)[]>,
  path: (LayerNodeData | RenderNodeData)[]
): (LayerNodeData | RenderNodeData)[] {
  const _path = [];

  for (const node of path) {
    // @ts-ignore
    if ("id" in node && !cache.has(node.id)) {
      // @ts-ignore
      _path.push(...expandPathIfNeeded(cache, cache.get(node.id)));
    } else {
      _path.push(node);
    }
  }

  return _path;
}

export function append(a: any[], b: any[]) {
  return a.map((a_i, i) => [...a_i, ...b[i]]);
}

// ! TODO: Implement darken, overlay
// Jimp.BLEND_SOURCE_OVER;
// Jimp.BLEND_DESTINATION_OVER;
// Jimp.BLEND_MULTIPLY;
// Jimp.BLEND_ADD;
// Jimp.BLEND_SCREEN;
// Jimp.BLEND_OVERLAY;
// Jimp.BLEND_DARKEN;
// Jimp.BLEND_LIGHTEN;
// Jimp.BLEND_HARDLIGHT;
// Jimp.BLEND_DIFFERENCE;
// Jimp.BLEND_EXCLUSION;
// opacitySource;
// opacityDest;
export function composeImages(
  back: Jimp,
  front: Jimp,
  blending: string,
  opacity: number
) {
  back.composite(
    front,
    0,
    0,
    // @ts-ignore
    {
      mode:
        blending === "normal"
          ? Jimp.BLEND_SOURCE_OVER // TODO: Check
          : blending === "screen"
          ? Jimp.BLEND_SCREEN
          : blending === "multiply"
          ? Jimp.BLEND_MULTIPLY
          : blending === "darken"
          ? Jimp.BLEND_DARKEN
          : blending === "overlay"
          ? Jimp.BLEND_OVERLAY
          : Jimp.BLEND_SOURCE_OVER,
      opacityDest: opacity,
    }
  );
  return back;
}

export function layersNames(inputDir: string) {
  return fs.readdirSync(inputDir).filter((file) => !file.startsWith("."));
}

export function name(inputDir: string) {
  return path.basename(inputDir);
}

export function sizeOf(inputDir: string) {
  const layer = fs
    .readdirSync(inputDir)
    .filter((file) => !file.startsWith("."))[0];
  const layerElement = fs
    .readdirSync(path.join(inputDir, layer))
    .filter((file) => !file.startsWith("."))[0];

  const { width, height } = imageSize(path.join(inputDir, layer, layerElement));
  return { width, height };
}

export async function compose(buffers: Buffer[], configuration: Configuration) {
  const height = configuration.height;
  const width = configuration.width;

  const image = await Jimp.read(buffers[0]);

  image.resize(width, height);

  for (let i = 1; i < buffers.length; i++) {
    const current = await Jimp.read(buffers[i]);
    current.resize(width, height);
    image.composite(current, 0, 0);
  }

  return new Promise((resolve, reject) => {
    image.getBuffer(Jimp.MIME_PNG, (error, buffer) => {
      if (error) reject(error);
      resolve(buffer);
    });
  });
}
