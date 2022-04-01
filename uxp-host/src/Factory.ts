import fs from "fs";
import path from "path";
import imageSize from "image-size";
import FormData from "form-data";
import axios from "axios";
import sharp, { Blend } from "sharp";

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
// import {
//   getOutgoers,
//   Elements as FlowElements,
//   Node as FlowNode,
//   getIncomers,
// } from "react-flow-renderer";

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

// export function getBranches(nodesAndEdges: NodesAndEdges): Node[][] {
//   const root = nodesAndEdges.find((node) => node.type === "rootNode") as Node;

//   const stack: {
//     node: Node;
//     path: Node[];
//   }[] = [
//     {
//       node: root,
//       path: [root],
//     },
//   ];

//   const savedPaths = [];
//   while (stack.length > 0) {
//     const actualNode = stack.pop();
//     const neighbors = getOutgoers(
//       actualNode.node as FlowNode,
//       nodesAndEdges as FlowElements
//     ) as Node[];

//     if (actualNode.node.type === "renderNode") {
//       savedPaths.push(actualNode.path);
//     } else {
//       for (const v of neighbors) {
//         stack.push({
//           node: v,
//           path: [...actualNode.path, v],
//         });
//       }
//     }
//   }

//   return savedPaths;
// }

// export function getBundles(
//   nodesAndEdges: NodesAndEdges
// ): Map<string, string[]> {
//   const bundleNodes = nodesAndEdges.filter(
//     (node) => node.type === "bundleNode"
//   ) as BundleNode[];

//   const bundles = new Map();
//   for (const bundleNode of bundleNodes) {
//     bundles.set(
//       bundleNode.data.bundle,
//       (
//         getIncomers(
//           bundleNode as FlowNode,
//           nodesAndEdges as FlowElements
//         ) as RenderNode[]
//       ).map((node) => node.data.renderId)
//     );
//   }

//   return bundles;
// }

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
      buffer = await sharp(buffer)
        .resize(this.configuration.width, this.configuration.height)
        .png()
        .toBuffer();
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
      bundles: this.bundles === undefined ? undefined : {},
      // Object.fromEntries(this.bundles),
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

  generateCollection(nodesAndEdges: NodesAndEdges) {
    // const branchesData = getBranches(nodesAndEdges)
    //   .map((path) => path.slice(1))
    //   .map((path) => path.map((node) => node.data))
    //   .sort((a, b) => a.length - b.length);

    // const computeNs = (
    //   branchesData: (LayerNodeData | RenderNodeData)[][]
    // ): Map<string, number> => {
    //   const ns = new Map<string, number>();

    //   branchesData = [...branchesData];
    //   for (let branchData of branchesData) {
    //     branchData = [...branchData];
    //     const { n } = branchData.pop() as RenderNodeData;
    //     for (const { layerId } of branchData as LayerNodeData[])
    //       if (!ns.has(layerId) || n > ns.get(layerId)) ns.set(layerId, n);
    //   }

    //   return ns;
    // };

    // const ns = computeNs(branchesData);

    // const computeNTraits = (layer: Layer, n: number) => {
    //   const nTraits: Trait[] = [];

    //   const { name } = layer;
    //   for (let i = 0; i < n; i++) {
    //     const traits = this.traitsByLayerName.get(name);
    //     const trait = choose(traits);
    //     nTraits.push(trait);
    //   }

    //   return nTraits;
    // };

    // const computeCache = (
    //   branchesData: (LayerNodeData | RenderNodeData)[][],
    //   ns: Map<string, number>
    // ): Map<string, Trait[]> => {
    //   const cache = new Map<string, Trait[]>();

    //   branchesData = [...branchesData];
    //   for (let branchData of branchesData) {
    //     branchData = [...branchData];
    //     branchData.pop();

    //     for (const data of branchData as LayerNodeData[]) {
    //       const layer = {
    //         ...this.layerByName.get(data.name),
    //         blending: data.blending,
    //         opacity: data.opacity,
    //       } as Layer;
    //       cache.set(data.layerId, computeNTraits(layer, ns.get(data.layerId)));
    //     }
    //   }

    //   return cache;
    // };

    // const cache = computeCache(branchesData, ns);

    const collection: Collection = [];

    // let i = 1;
    // for (const branchData of branchesData) {
    //   const { n } = branchData.pop() as RenderNodeData;

    //   let nTraits = Array.from({ length: n }, () => []);
    //   // nTraits = append(nTraits, cache.get(data.layerId).slice(0, n));
    //   for (const data of branchData as LayerNodeData[])
    //     nTraits = nTraits.map((traits, i) => [
    //       ...traits,
    //       cache.get(data.layerId)[i],
    //     ]);

    //   const collectionItems = nTraits.map((traits) => ({
    //     name: `${i++}`,
    //     traits,
    //   }));

    //   collection.push(...collectionItems);
    // }

    // this.nodes = nodesAndEdges;
    // this.collection = collection;
    // this.configuration.n = collection.length;

    return collection;
  }

  computeMaxCombinations(layers: Layer[]) {
    return layers.reduce(
      (combinations, layer) =>
        combinations * this.traitsByLayerName.get(layer.name).length,
      1
    );
  }

  async composeTraits(traits: Trait[], maxSize?: number) {
    const keys = await Promise.all(
      traits.map(async (trait) => await this._ensureTraitBuffer(trait))
    );

    const buffers = keys.map((key) => this.traitsBuffer.get(key));

    return await restrictImage(
      await sharp({
        create: {
          width: this.configuration.width,
          height: this.configuration.height,
          channels: 4,
          background: this.configuration.generateBackground
            ? {
                r: Math.floor(Math.random() * 255),
                g: Math.floor(Math.random() * 255),
                b: Math.floor(Math.random() * 255),
                alpha: 1,
              }
            : this.configuration.defaultBackground,
        },
      })
        .composite(
          traits.map(
            ({ blending }, i) => ({
              input: buffers[i],
              blend: (blending === "normal" ? "over" : blending) as Blend,
            }),
            this
          )
        )
        .png()
        .toBuffer(),
      maxSize
    );
  }

  async generateImage(collectionItem: CollectionItem) {
    const keys = await Promise.all(
      collectionItem.traits.map(
        async (trait) => await this._ensureTraitBuffer(trait)
      )
    );

    const buffers = keys.map((key) => this.traitsBuffer.get(key));

    await sharp({
      create: {
        width: this.configuration.width,
        height: this.configuration.height,
        channels: 4,
        background: this.configuration.generateBackground
          ? {
              r: Math.floor(Math.random() * 255),
              g: Math.floor(Math.random() * 255),
              b: Math.floor(Math.random() * 255),
              alpha: 1,
            }
          : this.configuration.defaultBackground,
      },
    })
      .composite(
        collectionItem.traits.map(
          ({ blending }, i) => ({
            input: buffers[i],
            blend: (blending === "normal" ? "over" : blending) as Blend,
          }),
          this
        )
      )
      .png()
      .toFile(
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
    if (!this.imagesGenerated) return;
    if (!this.imagesCid) return;

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
    return [trait, await this.getTraitImage(trait, maxSize)];
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
    return [collectionItem, await this.getImage(collectionItem, maxSize)];
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
    return [collectionItem, await this.getMetadata(collectionItem)];
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