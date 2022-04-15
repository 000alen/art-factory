import fs from "fs";
import path from "path";
import imageSize from "image-size";
import sharp, { Blend } from "sharp";
import {
  Bundles,
  BundlesInfo,
  Collection,
  CollectionItem,
  Configuration,
  Generation,
  Layer,
  MetadataItem,
  Secrets,
  Template,
  Trait,
} from "./typings";
import {
  append,
  choose,
  hash,
  pinDirectoryToIPFS,
  pinFileToIPFS,
  rarity,
  readDir,
  removeRarity,
  replaceAll,
  restrictImage,
} from "./utils";
import { BUILD_DIR_NAME, DEFAULT_BLENDING, DEFAULT_OPACITY } from "./constants";
import { getBranches } from "./nodesUtils";
import { Node as FlowNode } from "react-flow-renderer";
import { v4 as uuid } from "uuid";
export class Factory {
  buildDir: string;

  layerByName: Map<string, Layer>;
  traitsByLayerName: Map<string, Trait[]>;
  traitsBuffer: Map<string, Buffer>;

  secrets: Secrets;

  constructor(public configuration: Configuration, public projectDir: string) {
    this.buildDir = path.join(this.projectDir, BUILD_DIR_NAME);
    this.layerByName = new Map();
    this.traitsByLayerName = new Map();
    this.traitsBuffer = new Map();

    this._ensureOutputDir();
    this._ensureLayers();
  }

  private async _ensureOutputDir() {
    if (!fs.existsSync(this.buildDir)) fs.mkdirSync(this.buildDir);

    if (!fs.existsSync(path.join(this.buildDir, "images")))
      fs.mkdirSync(path.join(this.buildDir, "images"));

    if (!fs.existsSync(path.join(this.buildDir, "json")))
      fs.mkdirSync(path.join(this.buildDir, "json"));
  }

  private async _ensureLayers() {
    const layersPaths: string[] = await readDir(this.projectDir);

    const layers: Layer[] = layersPaths.map((layerPath) => ({
      basePath: path.join(this.projectDir, layerPath),
      name: layerPath,
      blending: DEFAULT_BLENDING,
      opacity: DEFAULT_OPACITY,
    }));

    const traitsPathsByLayerIndex: string[][] = await Promise.all(
      layersPaths.map((layerName) =>
        readDir(path.join(this.projectDir, layerName))
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

  loadSecrets(secrets: Secrets) {
    this.secrets = secrets;
  }

  reloadConfiguration(configuration: Configuration) {
    this.configuration = configuration;
  }

  reloadLayers() {
    this._ensureLayers();
  }

  getLayerByName(layerName: string) {
    return this.layerByName.get(layerName);
  }

  getTraitsByLayerName(layerName: string) {
    return this.traitsByLayerName.get(layerName);
  }

  makeGeneration(name: string, template: Template): Generation {
    interface LayerNodeComponentData {
      urls?: Record<string, string>;
      trait: Trait;
      id: string;
      name: string;
      opacity: number;
      blending: string;
    }

    const { nodes, edges, ns, ignored } = template;

    const nData = (
      getBranches(nodes, edges).map((branch) =>
        branch.slice(1, -1)
      ) as FlowNode<LayerNodeComponentData>[][]
    ).map((branch) => branch.map((node) => node.data));
    let keys = nData
      .map((branch) =>
        branch.map((data) => ({
          ...data.trait,
          id: data.id,
        }))
      )
      .map(hash);

    const nTraits: Trait[][] = nData
      .map((branch) =>
        branch.map((data) => ({
          ...data.trait,
          id: data.id,
          opacity: data.opacity,
          blending: data.blending,
        }))
      )
      .filter((_, i) => !ignored.includes(keys[i]));

    keys = keys.filter((key) => !ignored.includes(key));

    const bundlesInfo: BundlesInfo = nodes
      .filter((node) => node.type === "bundleNode")
      .map((node) => node.data)
      .map((data) => ({
        name: data.name,
        ids: data.ids,
      }));

    const computeTraitsNs = (
      _nTraits: Trait[][],
      _branchesNs: Record<string, number>
    ): Record<string, number> => {
      const maxNs: Record<string, number> = {};

      _nTraits = [..._nTraits];
      for (let [index, traits] of _nTraits.entries()) {
        traits = [...traits];
        const n = _branchesNs[keys[index]];
        for (const { id } of traits)
          if (!(id in maxNs) || n > maxNs[id]) maxNs[id] = n;
      }

      return maxNs;
    };

    const computeBundlesNs = (
      _bundlesInfo: BundlesInfo,
      _branchesNs: Record<string, number>
    ): Record<string, number> => {
      const bundlesNs: Record<string, number> = {};
      for (const { name, ids } of _bundlesInfo)
        bundlesNs[name] = Math.min(...ids.map((id) => _branchesNs[id]));
      return bundlesNs;
    };

    const computeNTraits = (layer: Layer, n: number) => {
      const nTraits: Trait[] = [];

      const { name } = layer;
      for (let i = 0; i < n; i++) {
        const traits = this.traitsByLayerName.get(name);
        const trait = choose(traits);
        nTraits.push(trait);
      }

      return nTraits;
    };

    const computeCache = (
      _nTraits: Trait[][],
      _traitsNs: Record<string, number>
    ): Record<string, Trait[]> => {
      const cache: Record<string, Trait[]> = {};

      _nTraits = [..._nTraits];
      for (let traits of _nTraits) {
        traits = [...traits];

        for (const trait of traits)
          cache[trait.id] = computeNTraits(trait, _traitsNs[trait.id]);
      }

      return cache;
    };

    const traitsNs = computeTraitsNs(nTraits, ns);
    const bundlesNs = computeBundlesNs(bundlesInfo, ns);
    const cache = computeCache(nTraits, traitsNs);
    const collection: Collection = [];
    const bundles: Bundles = [];

    let i = 1;
    for (const [index, traits] of nTraits.entries()) {
      const n = ns[keys[index]];

      let nTraits = Array.from({ length: n }, () => []);
      for (const trait of traits)
        nTraits = nTraits.map((traits, i) => [...traits, cache[trait.id][i]]);

      const collectionItems = nTraits.map((traits) => ({
        name: `${i++}`,
        traits,
      }));

      const bundle = bundlesInfo.find(({ ids }) => ids.includes(keys[index]));

      if (bundle !== undefined) {
        const bundleName = bundle.name;

        if (!bundles.some((b) => b.name === bundleName))
          bundles.push({
            name: bundleName,
            ids: Array.from({ length: bundlesNs[bundleName] }, () => []),
          });

        const bundleIndex = bundles.findIndex((b) => b.name === bundleName);
        bundles[bundleIndex].ids = append(
          bundles[bundleIndex].ids,
          collectionItems
            .map((collectionItem) => collectionItem.name)
            .slice(0, bundlesNs[bundleName])
            .map((name) => [name])
        );
      }

      collection.push(...collectionItems);
    }

    return { id: uuid(), name, collection, bundles };
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
            : {
                r: this.configuration.defaultBackground.r,
                g: this.configuration.defaultBackground.g,
                b: this.configuration.defaultBackground.b,
                alpha: this.configuration.defaultBackground.a,
              },
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

  async generateImage(item: CollectionItem, folder: string = "images") {
    const keys = await Promise.all(
      item.traits.map(async (trait) => await this._ensureTraitBuffer(trait))
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
          : {
              r: this.configuration.defaultBackground.r,
              g: this.configuration.defaultBackground.g,
              b: this.configuration.defaultBackground.b,
              alpha: this.configuration.defaultBackground.a,
            },
      },
    })
      .composite(
        item.traits.map(
          ({ blending }, i) => ({
            input: buffers[i],
            blend: (blending === "normal" ? "over" : blending) as Blend,
          }),
          this
        )
      )
      .png()
      .toFile(path.join(this.buildDir, folder, `${item.name}.png`));
  }

  async generateImages(
    generation: Generation,
    callback?: (name: string) => void
  ) {
    const { name, collection } = generation;
    if (!fs.existsSync(path.join(this.buildDir, "images", name)))
      fs.mkdirSync(path.join(this.buildDir, "images", name));

    await Promise.all(
      collection.map(async (collectionItem) => {
        await this.generateImage(collectionItem, path.join("images", name));
        if (callback) callback(collectionItem.name);
      })
    );
  }

  async generateMetadata(
    generation: Generation,
    metadataItems: MetadataItem[],
    callback?: (name: string) => void
  ) {
    const { name, collection } = generation;

    if (!fs.existsSync(path.join(this.buildDir, "json", name)))
      fs.mkdirSync(path.join(this.buildDir, "json", name));

    const metadatas = [];
    for (const collectionItem of collection) {
      const metadata: any = {
        name: this.configuration.name,
        description: this.configuration.description,
        image: `ipfs://<unknown>/${collectionItem.name}.png`,
        edition: collectionItem.name,
        date: Date.now(),
        attributes: collectionItem.traits.map((trait) => ({
          trait_type: trait.name,
          value: trait.value,
        })),
      };
      for (const { key, value } of metadataItems)
        metadata[key] = replaceAll(value, /\${name}/, collectionItem.name);

      metadatas.push(metadata);

      await fs.promises.writeFile(
        path.join(this.buildDir, "json", name, `${collectionItem.name}.json`),
        JSON.stringify(metadata)
      );
    }

    await fs.promises.writeFile(
      path.join(this.buildDir, "json", "metadata.json"),
      JSON.stringify(metadatas)
    );
  }

  async hydrateMetadata(
    generation: Generation,
    imagesCid: string,
    callback?: (name: string) => void
  ) {
    const { name, collection } = generation;

    if (!fs.existsSync(path.join(this.buildDir, "json", name)))
      fs.mkdirSync(path.join(this.buildDir, "json", name));

    const metadatas = [];
    for (const collectionItem of collection) {
      const metadata = JSON.parse(
        await fs.promises.readFile(
          path.join(this.buildDir, "json", name, `${collectionItem.name}.json`),
          "utf8"
        )
      );
      metadata["image"] = `ipfs://${imagesCid}/${collectionItem.name}.png`;

      metadatas.push(metadata);

      await fs.promises.writeFile(
        path.join(this.buildDir, "json", name, `${collectionItem.name}.json`),
        JSON.stringify(metadata)
      );
    }

    await fs.promises.writeFile(
      path.join(this.buildDir, "json", "metadata.json"),
      JSON.stringify(metadatas)
    );
  }

  // factoryDeployAssets = async (
  //   id: string,
  //   secrets: Secrets,
  //   name: string,
  //   collection: Collection,
  //   configuration: Configuration,
  //   partialDeploy: any
  // ) => {
  //   let imagesCid, metadataCid, notRevealedImageCid, notRevealedMetadataCid;

  //   // await factoryLoadSecrets(id, secrets);

  //   // try {
  //   //   imagesCid = partialDeploy
  //   //     ? partialDeploy.imagesCid
  //   //     : await factoryDeployImages(id);

  //   //   if (!partialDeploy) await factoryGenerateMetadata(id, name, collection, []);

  //   //   metadataCid = partialDeploy
  //   //     ? partialDeploy.metadataCid
  //   //     : await factoryDeployMetadata(id);

  //   //   notRevealedImageCid =
  //   //     configuration.contractType === "721_reveal_pause"
  //   //       ? ((await factoryDeployNotRevealedImage(id)) as string)
  //   //       : undefined;

  //   //   notRevealedMetadataCid =
  //   //     configuration.contractType === "721_reveal_pause"
  //   //       ? ((await factoryDeployNotRevealedMetadata(id)) as string)
  //   //       : undefined;
  //   // } catch (error) {
  //   //   throw FormattedError(4, "Could not deploy assets", {
  //   //     // collection,
  //   //     imagesCid,
  //   //     metadataCid,
  //   //     message: error.message,
  //   //   });
  //   // }

  //   return {
  //     imagesCid,
  //     metadataCid,
  //     notRevealedImageCid,
  //     notRevealedMetadataCid,
  //   };
  // };

  // deploy721 = async (
  //   contractFactory: ContractFactory,
  //   configuration: Configuration,
  //   metadataCid: string
  // ) =>
  //   await contractFactory.deploy(
  //     configuration.name,
  //     configuration.symbol,
  //     `ipfs://${metadataCid}/`,
  //     utils.parseEther(`${configuration.cost}`),
  //     10, // configuration.n, // ! TODO
  //     configuration.maxMintAmount
  //   );

  // deploy721_reveal_pause = async (
  //   contractFactory: ContractFactory,
  //   configuration: Configuration,
  //   metadataCid: string,
  //   notRevealedImageCid: string
  // ) =>
  //   await contractFactory.deploy(
  //     configuration.name,
  //     configuration.symbol,
  //     `ipfs://${metadataCid}/`,
  //     `ipfs://${notRevealedImageCid}`,
  //     utils.parseEther(`${configuration.cost}`),
  //     10, // configuration.n, // ! TODO
  //     configuration.maxMintAmount
  //   );

  // factoryDeployContract = async (
  //   id: string,
  //   configuration: Configuration,
  //   network: Network,
  //   signer: Signer,
  //   metadataCid: string,
  //   notRevealedMetadataCid: string
  // ) => {
  //   let contracts;
  //   try {
  //     ({ contracts } = await getContract(configuration.contractType));
  //   } catch (error) {
  //     throw FormattedError(5, "Could not get contract", {
  //       message: error.message,
  //     });
  //   }

  //   const { NFT } = contracts[configuration.contractType];
  //   const metadata = JSON.parse(NFT.metadata);
  //   const { version: compilerVersion } = metadata.compiler;

  //   const { abi } = NFT;
  //   const { evm } = NFT;
  //   const { bytecode } = evm;
  //   const contractFactory = new ContractFactory(abi, bytecode, signer);

  //   let contract;
  //   try {
  //     contract =
  //       configuration.contractType === ContractType.ERC721
  //         ? await deploy721(contractFactory, configuration, metadataCid)
  //         : configuration.contractType === ContractType.ERC721_REVEAL_PAUSE
  //         ? await deploy721_reveal_pause(
  //             contractFactory,
  //             configuration,
  //             metadataCid,
  //             notRevealedMetadataCid
  //           )
  //         : null;
  //     // : await deploy1155(
  //     //     contractFactory,
  //     //     configuration as Configuration1155,
  //     //     metadataCid
  //     //   );
  //   } catch (error) {
  //     throw FormattedError(6, "Could not deploy contract", {
  //       // configuration,
  //       message: error.message,
  //     });
  //   }

  //   const contractAddress = contract.address;
  //   const transactionHash = contract.deployTransaction.hash;

  //   return {
  //     contractAddress,
  //     abi,
  //     compilerVersion,
  //     transactionHash,
  //     wait: contract.deployTransaction.wait(),
  //   };
  // };

  // ipcAsyncTask("getContract", async (name) => {
  //   const content = await fs.promises.readFile(
  //     path.join(__dirname, "contracts", `${name}.sol`),
  //     {
  //       encoding: "utf8",
  //     }
  //   );
  //   const input = {
  //     language: "Solidity",
  //     sources: {
  //       [name]: {
  //         content,
  //       },
  //     },
  //     settings: {
  //       outputSelection: {
  //         "*": {
  //           "*": ["*"],
  //         },
  //       },
  //     },
  //   };
  //   return JSON.parse(solc.compile(JSON.stringify(input)));
  // });

  // ipcAsyncTask(
  //   "getContractSource",
  //   async (name) =>
  //     await fs.promises.readFile(
  //       path.join(__dirname, "contracts", `${name}.sol`),
  //       {
  //         encoding: "utf8",
  //       }
  //     )
  // );

  async deployNotRevealedImage(generation: Generation) {
    const { IpfsHash } = await pinFileToIPFS(
      this.secrets.pinataApiKey,
      this.secrets.pinataSecretApiKey,
      path.join(this.buildDir, "json", generation.name, "1.png") // ? INFO: hardcoded
    );

    return IpfsHash;
  }

  async deployNotRevealedMetadata(generation: Generation) {
    const { IpfsHash } = await pinFileToIPFS(
      this.secrets.pinataApiKey,
      this.secrets.pinataSecretApiKey,
      path.join(this.buildDir, "json", generation.name, "1.json") // ? INFO: hardcoded
    );

    return IpfsHash;
  }

  async deployImages(generation: Generation) {
    const { IpfsHash } = await pinDirectoryToIPFS(
      this.secrets.pinataApiKey,
      this.secrets.pinataSecretApiKey,
      path.join(this.buildDir, "images", generation.name)
    );

    return IpfsHash;
  }

  async deployMetadata(generation: Generation) {
    const { IpfsHash } = await pinDirectoryToIPFS(
      this.secrets.pinataApiKey,
      this.secrets.pinataSecretApiKey,
      path.join(this.buildDir, "json", generation.name)
    );

    return IpfsHash;
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

  async getImage(
    generation: Generation,
    item: CollectionItem,
    maxSize?: number
  ) {
    const buffer = await restrictImage(
      await fs.promises.readFile(
        path.join(this.buildDir, "images", generation.name, `${item.name}.png`)
      ),
      maxSize
    );
    return buffer;
  }

  async getRandomImage(generation: Generation, maxSize?: number) {
    const { collection } = generation;
    const item = collection[Math.floor(Math.random() * collection.length)];
    return [item, await this.getImage(generation, item, maxSize)];
  }

  async getMetadata(generation: Generation, item: CollectionItem) {
    const metadata = await fs.promises.readFile(
      path.join(this.buildDir, "json", generation.name, `${item.name}.json`),
      "utf8"
    );
    return JSON.parse(metadata);
  }

  async getRandomMetadata(generation: Generation) {
    const { collection } = generation;
    const item = collection[Math.floor(Math.random() * collection.length)];
    return [item, await this.getMetadata(generation, item)];
  }

  async removeItems(generation: Generation, items: Collection) {
    let { name, collection, bundles } = generation;

    await Promise.all(
      items.map(async (item) => {
        await fs.promises.rm(
          path.join(this.buildDir, "images", name, `${item.name}.png`)
        );
        await fs.promises.rm(
          path.join(this.buildDir, "json", name, `${item.name}.json`)
        );
      })
    );

    collection = collection.filter(
      (item) =>
        !items.some((itemToRemove) => {
          return item.name === itemToRemove.name;
        })
    );

    bundles = bundles.map(({ name, ids }) => ({
      name,
      ids: ids.filter(
        (ids) => !ids.some((id) => items.some((item) => item.name === id))
      ),
    }));

    for (const [i, item] of collection.entries()) {
      await fs.promises.rename(
        path.join(this.buildDir, "images", name, `${item.name}.png`),
        path.join(this.buildDir, "images", name, `_${i + 1}.png`)
      );

      await fs.promises.rename(
        path.join(this.buildDir, "json", name, `${item.name}.json`),
        path.join(this.buildDir, "json", name, `_${i + 1}.json`)
      );

      const _bundles = [];
      for (const { name, ids } of bundles) {
        const newIds = [];
        for (const _ids of ids) {
          newIds.push(
            _ids.includes(item.name)
              ? _ids.map((id) => (id === item.name ? `_${i + 1}` : id))
              : _ids
          );
        }
        _bundles.push({ name, ids: newIds });
      }
      bundles = _bundles;

      item.name = `${i + 1}`;
    }

    for (const [i, item] of collection.entries()) {
      await fs.promises.rename(
        path.join(this.buildDir, "images", name, `_${i + 1}.png`),
        path.join(this.buildDir, "images", name, `${i + 1}.png`)
      );

      await fs.promises.rename(
        path.join(this.buildDir, "json", name, `_${i + 1}.json`),
        path.join(this.buildDir, "json", name, `${i + 1}.json`)
      );

      const _bundles = [];
      for (const { name, ids } of bundles) {
        const newIds = [];
        for (const _ids of ids) {
          newIds.push(
            _ids.includes(`_${i + 1}`)
              ? _ids.map((id) => (id === `_${i + 1}` ? `${i + 1}` : id))
              : _ids
          );
        }
        _bundles.push({ name, ids: newIds });
      }
      bundles = _bundles;
    }

    return collection;
  }

  async regenerateItems(generation: Generation, items: Collection) {
    let { name, collection } = generation;

    const newItems: Collection = items.map(({ name, traits }) => ({
      name,
      traits: traits.map((trait) =>
        choose(this.traitsByLayerName.get(trait.name))
      ),
    }));
    await this.generateImages({ name, collection: newItems } as Generation);
    const newCollectionItemsByName = new Map(
      newItems.map((item) => [item.name, item])
    );
    collection = collection.map((collectionItem) =>
      newCollectionItemsByName.has(collectionItem.name)
        ? newCollectionItemsByName.get(collectionItem.name)
        : collectionItem
    );
    return collection;
  }

  async unify(name: string, generations: Generation[]) {
    if (!fs.existsSync(path.join(this.buildDir, "images", name)))
      fs.mkdirSync(path.join(this.buildDir, "images", name));

    if (!fs.existsSync(path.join(this.buildDir, "json", name)))
      fs.mkdirSync(path.join(this.buildDir, "json", name));

    const unifiedCollection: Collection = [];
    const unifiedBundles: Bundles = [];

    let i = 1;
    for (const { name: currentName, collection, bundles } of generations) {
      const mappings: Record<string, string> = {};

      for (const collectionItem of collection) {
        mappings[collectionItem.name] = `${i}`;

        await fs.promises.copyFile(
          path.join(
            this.buildDir,
            "images",
            currentName,
            `${collectionItem.name}.png`
          ),
          path.join(this.buildDir, "images", name, `${i}.png`)
        );

        await fs.promises.copyFile(
          path.join(
            this.buildDir,
            "json",
            currentName,
            `${collectionItem.name}.json`
          ),
          path.join(this.buildDir, "json", name, `${i}.json`)
        );

        unifiedCollection.push({
          ...collectionItem,
          name: `${i}`,
        });

        i++;
      }

      unifiedBundles.push(
        ...bundles.map(({ name, ids }) => ({
          name,
          ids: ids.map((_ids) => _ids.map((id) => mappings[id])),
        }))
      );
    }

    return { collection: unifiedCollection, bundles: unifiedBundles };
  }

  async remove(generation: Generation) {
    await fs.promises.rm(path.join(this.buildDir, "images", generation.name), {
      recursive: true,
      force: true,
    });
    await fs.promises.rm(path.join(this.buildDir, "json", generation.name), {
      recursive: true,
      force: true,
    });
  }
}
