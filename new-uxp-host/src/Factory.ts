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
  Instance,
  Layer,
  LayerNodeData,
  Node,
  NodesAndEdges,
  Secrets,
  Trait,
  RenderNodeData,
  RenderNode,
  BundleNode,
} from "./typings";
import { append, rarity, removeRarity } from "./utils";
import {
  getOutgoers,
  Elements as FlowElements,
  Node as FlowNode,
  getIncomers,
} from "react-flow-renderer";

export const DEFAULT_BLENDING = "normal";
export const DEFAULT_OPACITY = 1;
export const DEFAULT_BACKGROUND = "#ffffff";

// #region Utils
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
    const neighbors = getOutgoers(
      actualNode.node as FlowNode,
      nodesAndEdges as FlowElements
    ) as Node[];

    if (actualNode.node.type === "renderNode") {
      savedPaths.push(actualNode.path);
    } else {
      for (const v of neighbors) {
        stack.push({
          node: v,
          path: [...actualNode.path, v],
        });
      }
    }
  }

  return savedPaths;
}

export function getBundles(
  nodesAndEdges: NodesAndEdges
): Map<string, string[]> {
  const bundleNodes = nodesAndEdges.filter(
    (node) => node.type === "bundleNode"
  ) as BundleNode[];

  const bundles = new Map();
  for (const bundleNode of bundleNodes) {
    bundles.set(
      bundleNode.data.bundle,
      (
        getIncomers(
          bundleNode as FlowNode,
          nodesAndEdges as FlowElements
        ) as RenderNode[]
      ).map((node) => node.data.renderId)
    );
  }

  return bundles;
}

export function computeBundlesNs(
  bundlesByRenderIds: Map<string, string[]>,
  nodesAndEdges: NodesAndEdges
) {
  const ns = new Map();
  for (const [bundle, renderIds] of bundlesByRenderIds) {
    const renderNs = renderIds
      .map((renderId) =>
        nodesAndEdges.find(
          (node) => "renderId" in node.data && node.data.renderId === renderId
        )
      )
      .map((node) => node.data.n);
    const n = Math.min(...renderNs);
    ns.set(bundle, n);
  }

  return ns;
}

export function getBundle(
  bundlesByRenderId: Map<string, string[]>,
  renderId: string
) {
  for (const [bundle, renderIds] of bundlesByRenderId) {
    if (renderIds.includes(renderId)) {
      return bundle;
    }
  }
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
    if ("name" in node && cache.has(node.name)) {
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
// #endregion

export class Factory {
  layerByName: Map<string, Layer>;
  traitsByLayerName: Map<string, Trait[]>;
  traitsBuffer: Map<string, Buffer>;

  nodes: NodesAndEdges;
  collection: Collection;
  bundles: Map<string, string[][]>;

  secrets: Secrets;
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
    this.traitsBuffer = new Map();

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
    if (this.traitsBuffer.has(key)) return key;

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
    return key;
  }

  instance() {
    return {
      inputDir: this.inputDir,
      outputDir: this.outputDir,
      configuration: this.configuration,
      collection: this.collection,
      bundles:
        this.bundles === undefined
          ? undefined
          : Object.fromEntries(this.bundles),
      nodes: this.nodes,
      imagesGenerated: this.imagesGenerated,
      metadataGenerated: this.metadataGenerated,
      imagesCid: this.imagesCid,
      metadataCid: this.metadataCid,
      network: this.network,
      contractAddress: this.contractAddress,
      abi: this.abi,
      compilerVersion: this.compilerVersion,
    };
  }

  loadInstance(instance: Partial<Instance>) {
    const {
      inputDir,
      outputDir,
      configuration,
      collection,
      bundles,
      nodes,
      imagesGenerated,
      metadataGenerated,
      imagesCid,
      metadataCid,
      network,
      contractAddress,
      abi,
      compilerVersion,
    } = instance;

    if (inputDir) this.inputDir = inputDir;
    if (outputDir) this.outputDir = outputDir;
    if (configuration) this.configuration = configuration;
    if (collection) this.collection = collection;
    if (bundles) this.bundles = new Map(Object.entries(bundles));
    if (nodes) this.nodes = nodes;
    if (imagesGenerated) this.imagesGenerated = imagesGenerated;
    if (metadataGenerated) this.metadataGenerated = metadataGenerated;
    if (imagesCid) this.imagesCid = imagesCid;
    if (metadataCid) this.metadataCid = metadataCid;
    if (network) this.network = network;
    if (contractAddress) this.contractAddress = contractAddress;
    if (abi) this.abi = abi;
    if (compilerVersion) this.compilerVersion = compilerVersion;
  }

  async saveInstance() {
    await this._ensureOutputDir();
    const instancePath = path.join(this.outputDir, "instance.json");
    await fs.promises.writeFile(instancePath, JSON.stringify(this.instance()));
    return instancePath;
  }

  loadSecrets(secrets: Secrets) {
    this.secrets = secrets;
  }

  getLayerByName(layerName: string) {
    return this.layerByName.get(layerName);
  }

  getTraitsByLayerName(layerName: string) {
    return this.traitsByLayerName.get(layerName);
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
      .map((path) => path.map((node) => node.data))
      .sort((a, b) => a.length - b.length);

    const [branchesCache, reducedBranches] = reduceBranches(branchesData);
    const ns = computeNs(branchesCache, reducedBranches);

    const traitsCache = new Map();
    for (const [name, branch] of branchesCache) {
      const layers = (
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

    const bundlesByRenderId = getBundles(nodesAndEdges);
    const bundlesNs = computeBundlesNs(bundlesByRenderId, nodesAndEdges);
    const bundles = new Map();
    for (const [bundle, n] of bundlesNs)
      bundles.set(
        bundle,
        Array.from({ length: n }, () => [])
      );

    const collection: Collection = [];

    let i = 1;
    for (const branch of reducedBranches) {
      const { n, renderId } = branch.pop() as RenderNodeData;
      const layers: Layer[] = branch.map((data) =>
        dataToLayer(data as LayerNodeData | CacheNodeData, this.layerByName)
      );
      const nTraits = this.generateNTraits(layers, n, traitsCache);
      const collectionItems = nTraits.map((traits) => ({
        name: `${i++}`, // ! TODO
        traits,
      }));
      const nNames = collectionItems.map(
        (collectionItem) => collectionItem.name
      );

      const bundle = getBundle(bundlesByRenderId, renderId);

      if (bundle !== undefined) {
        const bundleValue = append(
          bundles.get(bundle),
          nNames.slice(0, bundlesNs.get(bundle)).map((name) => [name])
        );

        bundles.set(bundle, bundleValue);
      }

      collection.push(...collectionItems);
    }

    this.nodes = nodesAndEdges;
    this.collection = collection;
    this.configuration.n = collection.length;
    this.bundles = bundles;

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
      const key = await this._ensureTraitBuffer(trait);
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
    const key = await this._ensureTraitBuffer(trait);
    const buffer = await restrictImage(this.traitsBuffer.get(key), maxSize);
    return buffer;
  }

  async getRandomTraitImage(layer: Layer, maxSize?: number) {
    const traits = this.traitsByLayerName.get(layer.name);
    const trait = choose(traits);
    return await this.getTraitImage(trait, maxSize);
  }

  async rewriteTraitImage(trait: Trait, dataUrl: string) {
    await fs.promises.writeFile(
      path.join(trait.basePath, trait.fileName),
      Buffer.from(dataUrl.replace(/^data:image\/png;base64,/, ""), "base64")
    );
  }

  async getImage(collectionItem: CollectionItem, maxSize?: number) {
    const buffer = await restrictImage(
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
    return await this.getImage(collectionItem, maxSize);
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

  // ! TODO
  // vector<int> a = {1, 5, 8, 10, 13};
  // vector<int> b = {2, 8, 11, 13};
  // vector<int> c;
  // int i = 0, j = 0;
  // bool inb = false;
  // while (i < a.size() && j < b.size()) {
  //   if (a[i] == b[j]) ++i;
  //   else if (a[i]  > b[j]) ++j;
  //   else { // a[i] < b[i]
  //     c.push_back(a[i]);
  //     ++i;
  //   }
  // }
  async removeCollectionItems(collectionItemsToRemove: Collection) {
    await Promise.all(
      collectionItemsToRemove.map((itemToRemove) =>
        fs.promises.rm(
          path.join(this.outputDir, "images", `${itemToRemove.name}.png`)
        )
      )
    );

    const collection = this.collection.filter(
      (item) =>
        !collectionItemsToRemove.some((itemToRemove) => {
          return item.name === itemToRemove.name;
        })
    );

    // const bundles = new Map(
    //   [...this.bundles.entries()].filter(
    //     ([bundleName, nBundles]) =>
    //       !nBundles.some((bundle) =>
    //         collectionItemsToRemove.some((itemToRemove) =>
    //           bundle.includes(itemToRemove.name)
    //         )
    //       )
    //   )
    // );

    const bundles = new Map(
      [...this.bundles.entries()].map(([bundleName, nBundles]) => [
        bundleName,
        nBundles.filter(
          (bundle) =>
            !collectionItemsToRemove.some((itemToRemove) =>
              bundle.includes(itemToRemove.name)
            )
        ),
      ])
    );

    // !! TODO
    for (const [i, item] of collection.entries()) {
      await fs.promises.rename(
        path.join(this.outputDir, "images", `${item.name}.png`),
        path.join(this.outputDir, "images", `_${i + 1}.png`)
      );

      const _bundles = new Map(bundles);
      for (const [bundlesName, nBundles] of _bundles) {
        const newNBundles = [];
        for (const bundle of nBundles) {
          newNBundles.push(
            bundle.includes(item.name)
              ? bundle.map((name) => (name === item.name ? `_${i + 1}` : name))
              : bundle
          );
        }
        bundles.set(bundlesName, newNBundles);
      }

      item.name = `${i + 1}`;
    }

    console.log("bundles", bundles);

    for (const [i, item] of collection.entries()) {
      await fs.promises.rename(
        path.join(this.outputDir, "images", `_${i + 1}.png`),
        path.join(this.outputDir, "images", `${i + 1}.png`)
      );

      const _bundles = new Map(bundles);
      for (const [bundlesName, nBundles] of _bundles) {
        const newNBundles = [];
        for (const bundle of nBundles) {
          newNBundles.push(
            bundle.includes(`_${i + 1}`)
              ? bundle.map((name) => (name === `_${i + 1}` ? `${i + 1}` : name))
              : bundle
          );
        }
        bundles.set(bundlesName, newNBundles);
      }
    }

    console.log("bundles", bundles);

    this.collection = collection;
    this.bundles = bundles;
    this.configuration.n = collection.length;

    return collection;
  }
}

export async function loadInstance(instancePath: string) {
  const { inputDir, outputDir, configuration, ...instance } = JSON.parse(
    await fs.promises.readFile(instancePath, "utf8")
  );
  const factory = new Factory(configuration, inputDir, outputDir);
  factory.loadInstance(instance);
  return factory;
}
