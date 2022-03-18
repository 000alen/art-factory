import fs from "fs";
import path from "path";
import Jimp from "jimp";
import imageSize from "image-size";
import { tuple } from "immutable-tuple";
import { v4 as uuid } from "uuid";
import FormData from "form-data";
import axios from "axios";

import {
  CacheNodeData,
  Collection,
  CollectionItem,
  Configuration,
  Layer,
  LayerNodeData,
  Node,
  NodesAndEdges,
  Secrets,
  Trait,
} from "./newTypings";
import { append, rarity, removeRarity } from "./utils";
import { RenderNodeData } from "./typings";

const DEFAULT_BLENDING = "normal";
const DEFAULT_OPACITY = 1;
export const DEFAULT_BACKGROUND = "#ffffff";

async function readDir(dir: string): Promise<string[]> {
  return (await fs.promises.readdir(dir)).filter(
    (file) => !file.startsWith(".")
  );
}

export function choose(
  traits: Trait[],
  temperature = 50,
  randomFunction = Math.random,
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

export function getBranches(nodesAndEdges: NodesAndEdges): Node[][] {
  const root = nodesAndEdges.find((node) => node.type === "rootNode") as Node;

  const stack: {
    node: Node;
    path: Node[];
  }[] = [
    {
      node: root,
      path: [root],
    },
  ];

  const savedPaths = [];
  while (stack.length > 0) {
    const actualNode = stack.pop();
    // @ts-ignore
    const neighbors = getOutgoers(actualNode.node, nodesAndEdges);

    if (neighbors.length === 0 && actualNode.node.type === "renderNode")
      savedPaths.push(actualNode.path);

    for (const v of neighbors) {
      stack.push({
        node: v,
        path: [...actualNode.path, v],
      });
    }
  }

  return savedPaths;
}

export function getBranchesDataPrefixes(
  branchesData: (LayerNodeData | RenderNodeData | CacheNodeData)[][]
): (LayerNodeData | RenderNodeData | CacheNodeData)[][] {
  const branchDataPrefixes = new Set();

  for (const branchData of branchesData) {
    const filteredBranchesData = branchesData.filter(
      (_branchData) =>
        (_branchData[0] as LayerNodeData | CacheNodeData).name ===
        (branchData[0] as LayerNodeData | CacheNodeData).name
    );
    const subBranchesData = filteredBranchesData.map((_branchData) =>
      _branchData.slice(1)
    );
    if (subBranchesData.length > 1) {
      branchDataPrefixes.add(tuple(branchData[0]));
      const subBranchDataPrefixes = getBranchesDataPrefixes(subBranchesData);
      for (const subBranchDataPrefix of subBranchDataPrefixes) {
        branchDataPrefixes.add(tuple(branchData[0], ...subBranchDataPrefix));
      }
    }
  }

  return Array.from(branchDataPrefixes, (branchDataPrefix) =>
    Array.from(branchDataPrefix as Iterable<any>)
  );
}

export function reduceBranches(
  branchesData: (LayerNodeData | RenderNodeData | CacheNodeData)[][]
): [
  Map<string, (LayerNodeData | RenderNodeData | CacheNodeData)[]>,
  (LayerNodeData | RenderNodeData | CacheNodeData)[][]
] {
  const branchesCache = new Map();

  while (true) {
    const id = uuid();
    const branchesDataPrefixes = getBranchesDataPrefixes(branchesData)
      .map((branchDataPrefix) =>
        branchDataPrefix.length === 1 &&
        branchesCache.has(
          (branchDataPrefix[0] as LayerNodeData | CacheNodeData).name
        )
          ? null
          : branchDataPrefix
      )
      .filter((branchDataPrefix) => branchDataPrefix !== null)
      .sort((a, b) => a.length - b.length);

    const branchDataPrefix = branchesDataPrefixes[0];

    if (branchDataPrefix === undefined) break;

    branchesCache.set(id, branchDataPrefix);

    branchesData = branchesData.map((branchData) => {
      const _branchData = branchData.map((data) =>
        "name" in data ? data.name : data
      );
      const _branchDataPrefix = branchDataPrefix.map((data) =>
        "name" in data ? data.name : data
      );

      return tuple(..._branchData.slice(0, _branchDataPrefix.length)) ===
        tuple(..._branchDataPrefix)
        ? [
            { name: id } as CacheNodeData,
            ...branchData.slice(_branchDataPrefix.length),
          ]
        : branchData;
    });
  }

  return [branchesCache, branchesData];
}

export function computeNs(
  branchesCache: Map<
    string,
    (LayerNodeData | RenderNodeData | CacheNodeData)[]
  >,
  branches: (LayerNodeData | RenderNodeData | CacheNodeData)[][]
) {
  const ns = new Map();

  for (const [name, cachedPath] of branchesCache) {
    let n = branches
      .filter((branch) =>
        branch.find(
          (data) => (data as LayerNodeData | CacheNodeData).name === name
        )
      )
      .map((branch) => (branch.at(-1) as RenderNodeData).n)
      .reduce((a, b) => Math.max(a, b), 0);

    n = Math.max(ns.has(name) ? ns.get(name) : 0, n);
    const stack = [name];
    while (stack.length > 0) {
      const current = stack.pop();
      if (!ns.has(current) || ns.get(current) < n) ns.set(current, n);
      for (const v of branchesCache.get(current)) {
        if ("name" in v && ns.has(v.name)) stack.push(v.name);
      }
    }
  }

  return ns;
}

export function expandBranch(
  cache: Map<string, (LayerNodeData | RenderNodeData | CacheNodeData)[]>,
  branchData: (LayerNodeData | RenderNodeData | CacheNodeData)[]
): (LayerNodeData | RenderNodeData | CacheNodeData)[] {
  const _branchData = [];

  for (const node of branchData) {
    if ("name" in node && !cache.has(node.name)) {
      _branchData.push(...expandBranch(cache, cache.get(node.name)));
    } else {
      _branchData.push(node);
    }
  }

  return _branchData;
}

export function dataToLayer(
  data: LayerNodeData | CacheNodeData,
  layerByName: Map<string, Layer>
): Layer {
  return "name" in data && layerByName.has(data.name)
    ? layerByName.get(data.name)
    : {
        name: data.name,
        basePath: "<cache>",
        blending: "<cache>",
        opacity: DEFAULT_OPACITY,
      };
}

export function getRandomColor() {
  return Jimp.rgbaToInt(
    Math.floor(Math.random() * 256),
    Math.floor(Math.random() * 256),
    Math.floor(Math.random() * 256),
    255
  );
}

export function composeImages(
  back: Jimp,
  front: Jimp,
  blending: string,
  opacity: number
) {
  back.composite(front, 0, 0, {
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
    opacitySource: 1,
    opacityDest: opacity,
  });
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
      const image = await Jimp.read(buffer);
      image.resize(width, height);
      buffer = await image.getBufferAsync(Jimp.MIME_PNG);
    }
  }
  return buffer;
}

export class Factory {
  layerByName: Map<string, Layer>;
  traitsByLayerName: Map<string, Trait[]>;
  traitsBuffer: Map<string, Buffer>;

  secrets: Secrets;
  collection: Collection;
  imagesGenerated: boolean;
  metadataGenerated: boolean;
  imagesCid: string;
  metadataCid: string;
  network: string;
  compilerVersion: string;
  abi: any[];
  contractAddress: string;

  constructor(
    public configuration: Configuration,
    public inputDir: string,
    public outputDir: string
  ) {
    this.layerByName = new Map();
    this.traitsByLayerName = new Map();

    this._ensureOutputDir();
    this._ensureLayers();
  }

  private async _ensureOutputDir() {
    if (!fs.existsSync(this.outputDir)) fs.mkdirSync(this.outputDir);

    if (!fs.existsSync(path.join(this.outputDir, "json")))
      fs.mkdirSync(path.join(this.outputDir, "json"));

    if (!fs.existsSync(path.join(this.outputDir, "images")))
      fs.mkdirSync(path.join(this.outputDir, "images"));
  }

  private async _ensureLayers() {
    const layersPaths: string[] = await readDir(this.inputDir);

    const layers: Layer[] = layersPaths.map((layerPath) => ({
      basePath: path.join(this.inputDir, layerPath),
      name: layerPath,
      blending: DEFAULT_BLENDING,
      opacity: DEFAULT_OPACITY,
    }));

    const traitsPathsByLayerIndex: string[][] = await Promise.all(
      layersPaths.map((layerName) =>
        readDir(path.join(this.inputDir, layerName))
      )
    );

    const traitsByLayerIndex: Trait[][] = traitsPathsByLayerIndex.map(
      (traitsPaths, i) =>
        traitsPaths.map((traitPath) => {
          const { name: value, ext } = path.parse(traitPath);
          return {
            ...layers[i],
            fileName: traitPath,
            value: removeRarity(value),
            rarity: rarity(value),
            type: ext.slice(1),
          };
        })
    );

    layersPaths.forEach((layerPath, i) => {
      this.layerByName.set(layerPath, layers[i]);
      this.traitsByLayerName.set(layerPath, traitsByLayerIndex[i]);
    });
  }

  private async _ensureTraitBuffer(trait: Trait) {
    const key = path.join(trait.basePath, trait.fileName);
    if (this.traitsBuffer.has(key)) return;

    let buffer = await fs.promises.readFile(key);
    let { width, height } = imageSize(buffer);

    if (
      trait.type === "png" &&
      (width !== this.configuration.width ||
        height !== this.configuration.height)
    ) {
      const image = await Jimp.read(buffer);
      image.resize(this.configuration.width, this.configuration.height);
      buffer = await image.getBufferAsync(Jimp.MIME_PNG);
    }

    this.traitsBuffer.set(key, buffer);
  }

  generateNTraits(
    layers: Layer[],
    n: number,
    traitsCache: Map<string, Trait[]> = new Map()
  ) {
    let attributes: Trait[][] = Array.from({ length: n }, () => []);

    for (const layer of layers) {
      const { name } = layer;
      if (traitsCache.has(name)) {
        attributes = append(attributes, traitsCache.get(name).slice(0, n));
      } else {
        for (let i = 0; i < n; i++) {
          const traits = this.traitsByLayerName.get(name);
          const trait = choose(traits);
          attributes[i].push(trait);
        }
      }
    }

    return attributes;
  }

  generateCollection(nodesAndEdges: NodesAndEdges) {
    const branchesData = getBranches(nodesAndEdges)
      .map((path) => path.slice(1))
      .map((path) => path.map((node) => node.data));

    const [branchesCache, reducedBranches] = reduceBranches(branchesData);
    const ns = computeNs(branchesCache, reducedBranches);

    const traitsCache = new Map();
    for (const [name, branch] of branchesCache) {
      const layers: Layer[] = (
        expandBranch(branchesCache, branch) as unknown as (
          | LayerNodeData
          | CacheNodeData
        )[]
      ).map((data) => dataToLayer(data, this.layerByName));
      traitsCache.set(
        name,
        this.generateNTraits(layers, ns.get(name), traitsCache)
      );
    }

    const collection: Collection = [];
    for (const branch of reducedBranches) {
      const n = (branch.pop() as RenderNodeData).n;
      const layers: Layer[] = branch.map((data) =>
        dataToLayer(data as LayerNodeData | CacheNodeData, this.layerByName)
      );
      const nTraits = this.generateNTraits(layers, n, traitsCache);
      nTraits.forEach((traits, i) =>
        collection.push({
          name: `${i + 1}`, // ! TODO
          traits,
        })
      );
    }

    this.collection = collection;

    return collection;
  }

  async generateImage(collectionItem: CollectionItem) {
    const image = await Jimp.create(
      this.configuration.width,
      this.configuration.height,
      this.configuration.generateBackground
        ? getRandomColor()
        : this.configuration.defaultBackground || DEFAULT_BACKGROUND
    );

    for (const trait of collectionItem.traits) {
      await this._ensureTraitBuffer(trait);
      const key = path.join(trait.basePath, trait.fileName);
      const current = await Jimp.read(this.traitsBuffer.get(key));
      composeImages(image, current, trait.blending, trait.opacity);
    }

    await image.writeAsync(
      path.join(this.outputDir, "images", `${collectionItem.name}.png`)
    );
  }

  async generateImages(
    collection: Collection,
    callback?: (name: string) => void
  ) {
    await Promise.all(
      collection.map(async (collectionItem) => {
        await this.generateImage(collectionItem);
        if (callback) callback(collectionItem.name);
      })
    );
    this.imagesGenerated = true;
  }

  async generateMetadata(callback?: (name: string) => void) {
    if (!this.imagesGenerated) return; // TODO
    if (!this.imagesCid) return; // TODO

    const metadatas = [];
    for (const collectionItem of this.collection) {
      const metadata = {
        name: this.configuration.name,
        description: this.configuration.description,
        image: `ipfs://${this.imagesCid}/${collectionItem.name}.png`,
        edition: collectionItem.name,
        date: Date.now(),
        attributes: collectionItem.traits.map((trait) => ({
          trait_type: trait.name,
          value: trait.value,
        })),
      };
      metadatas.push(metadata);

      await fs.promises.writeFile(
        path.join(this.outputDir, "json", `${collectionItem.name}.json`),
        JSON.stringify(metadata)
      );
    }

    await fs.promises.writeFile(
      path.join(this.outputDir, "json", "metadata.json"),
      JSON.stringify(metadatas)
    );

    this.metadataGenerated = true;
  }

  async deployImages() {
    if (this.imagesCid) return this.imagesCid;

    const imagesDir = path.join(this.outputDir, "images");

    const { IpfsHash } = await pinDirectoryToIPFS(
      this.secrets.pinataApiKey,
      this.secrets.pinataSecretApiKey,
      imagesDir
    );
    this.imagesCid = IpfsHash;

    return this.imagesCid;
  }

  async deployMetadata() {
    if (this.metadataCid) return this.metadataCid;

    if (!this.imagesCid) return;

    const jsonDir = path.join(this.outputDir, "json");

    const { IpfsHash } = await pinDirectoryToIPFS(
      this.secrets.pinataApiKey,
      this.secrets.pinataSecretApiKey,
      jsonDir
    );
    this.metadataCid = IpfsHash;

    return this.metadataCid;
  }

  async getTraitImage(trait: Trait, maxSize?: number) {
    await this._ensureTraitBuffer(trait);
    const key = path.join(trait.name, trait.value);
    const buffer = restrictImage(this.traitsBuffer.get(key), maxSize);
    return buffer;
  }

  async getRandomTraitImage(layer: Layer, maxSize?: number) {
    const traits = this.traitsByLayerName.get(layer.name);
    const trait = choose(traits);
    return this.getTraitImage(trait, maxSize);
  }

  async rewriteTraitImage(trait: Trait, dataUrl: string) {
    await fs.promises.writeFile(
      path.join(trait.basePath, trait.fileName),
      Buffer.from(dataUrl.replace(/^data:image\/png;base64,/, ""), "base64")
    );
  }

  async getImage(collectionItem: CollectionItem, maxSize?: number) {
    const buffer = restrictImage(
      await fs.promises.readFile(
        path.join(this.outputDir, "images", `${collectionItem.name}.png`)
      ),
      maxSize
    );
    return buffer;
  }

  async getRandomImage(maxSize?: number) {
    const collectionItem =
      this.collection[Math.floor(Math.random() * this.collection.length)];
    return this.getImage(collectionItem, maxSize);
  }

  async rewriteImage(collectionItem: CollectionItem, dataUrl: string) {
    await fs.promises.writeFile(
      path.join(this.outputDir, "images", `${collectionItem.name}.png`),
      Buffer.from(dataUrl.replace(/^data:image\/png;base64,/, ""), "base64")
    );
  }

  async getMetadata(collectionItem: CollectionItem) {
    const metadata = await fs.promises.readFile(
      path.join(this.outputDir, "json", `${collectionItem.name}.json`)
    );
    return JSON.parse(metadata.toString());
  }

  async getRandomMetadata() {
    const collectionItem =
      this.collection[Math.floor(Math.random() * this.collection.length)];
    return this.getMetadata(collectionItem);
  }
}
