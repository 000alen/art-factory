import {
  ContractFactory,
  providers as ethersProviders,
  Signer,
  utils,
} from "ethers";
import fs from "fs";
import imageSize from "image-size";
import path from "path";
import { Node as FlowNode } from "react-flow-renderer";
import sharp, { Blend } from "sharp";
import { v4 as uuid } from "uuid";

import { BUILD_DIR_NAME, DEFAULT_BLENDING, DEFAULT_OPACITY } from "./constants";
import { providers } from "./ipc";
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
  getContract,
  hash,
  pinDirectoryToIPFS,
  pinFileToIPFS,
  rarity,
  readDir,
  removeRarity,
  replaceAll,
  restrictImage,
  getBranches,
} from "./utils";

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

      await fs.promises.writeFile(
        path.join(this.buildDir, "json", name, `${collectionItem.name}.json`),
        JSON.stringify(metadata)
      );
    }
  }

  async hydrateMetadata(
    generation: Generation,
    imagesCid: string,
    callback?: (name: string) => void
  ) {
    const { name, collection } = generation;

    if (!fs.existsSync(path.join(this.buildDir, "json", name)))
      fs.mkdirSync(path.join(this.buildDir, "json", name));

    for (const collectionItem of collection) {
      const metadata = JSON.parse(
        await fs.promises.readFile(
          path.join(this.buildDir, "json", name, `${collectionItem.name}.json`),
          "utf8"
        )
      );
      metadata["image"] = `ipfs://${imagesCid}/${collectionItem.name}.png`;

      await fs.promises.writeFile(
        path.join(this.buildDir, "json", name, `${collectionItem.name}.json`),
        JSON.stringify(metadata)
      );
    }
  }

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

  async deployAssets(
    generation: Generation,
    notRevealedGeneration?: Generation
  ) {
    const imagesCid = await this.deployImages(generation);
    await this.hydrateMetadata(generation, imagesCid);

    const metadataCid = await this.deployMetadata(generation);

    const notRevealedImageCid =
      this.configuration.contractType === "721_reveal_pause"
        ? await this.deployNotRevealedImage(notRevealedGeneration)
        : undefined;

    const notRevealedMetadataCid =
      this.configuration.contractType === "721_reveal_pause"
        ? await this.deployNotRevealedMetadata(notRevealedGeneration)
        : undefined;

    return {
      imagesCid,
      metadataCid,
      notRevealedImageCid,
      notRevealedMetadataCid,
    };
  }

  async deployContract721(
    generation: Generation,
    contractFactory: ContractFactory,
    metadataCid: string
  ) {
    return await contractFactory.deploy(
      this.configuration.name,
      this.configuration.symbol,
      `ipfs://${metadataCid}/`,
      utils.parseEther(`${this.configuration.cost}`),
      generation.collection.length,
      this.configuration.maxMintAmount
    );
  }

  async deployContract721_reveal_pause(
    generation: Generation,
    contractFactory: ContractFactory,
    metadataCid: string,
    notRevealedImageCid: string
  ) {
    return await contractFactory.deploy(
      this.configuration.name,
      this.configuration.symbol,
      `ipfs://${metadataCid}/`,
      `ipfs://${notRevealedImageCid}`,
      utils.parseEther(`${this.configuration.cost}`),
      generation.collection.length,
      this.configuration.maxMintAmount
    );
  }

  async deployContract(
    providerId: string,
    generation: Generation,
    metadataCid: string,
    notRevealedMetadataCid: string
  ) {
    const web3Provider = new ethersProviders.Web3Provider(
      providers[providerId]
    );

    const signer = web3Provider.getSigner();

    const { contracts } = await getContract(this.configuration.contractType);
    const { NFT } = contracts[this.configuration.contractType];
    const metadata = JSON.parse(NFT.metadata);
    const { version: compilerVersion } = metadata.compiler;
    const { abi, evm } = NFT;
    const { bytecode } = evm;
    const contractFactory = new ContractFactory(abi, bytecode, signer);

    const contract =
      this.configuration.contractType === "721"
        ? await this.deployContract721(generation, contractFactory, metadataCid)
        : this.configuration.contractType === "721_reveal_pause"
        ? await this.deployContract721_reveal_pause(
            generation,
            contractFactory,
            metadataCid,
            notRevealedMetadataCid
          )
        : null;

    const contractAddress = contract.address;
    const transactionHash = contract.deployTransaction.hash;

    return {
      contractAddress,
      abi,
      compilerVersion,
      transactionHash,
      wait: contract.deployTransaction.wait(),
    };
  }

  async deploy(
    providerId: string,
    generation: Generation,
    notRevealedGeneration?: Generation
  ) {
    const {
      imagesCid,
      metadataCid,
      notRevealedImageCid,
      notRevealedMetadataCid,
    } = await this.deployAssets(generation, notRevealedGeneration);

    const { contractAddress, abi, compilerVersion, transactionHash, wait } =
      await this.deployContract(
        providerId,
        generation,
        metadataCid,
        notRevealedMetadataCid
      );

    await wait;

    return {
      imagesCid,
      metadataCid,
      notRevealedImageCid,
      notRevealedMetadataCid,
      contractAddress,
      abi,
      compilerVersion,
      transactionHash,
    };
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

  // // TODO: Modify metadata
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

      await fs.promises.writeFile(
        path.join(this.buildDir, "json", name, `${item.name}.json`),
        JSON.stringify({
          ...JSON.parse(
            await fs.promises.readFile(
              path.join(this.buildDir, "json", name, `${item.name}.json`),
              "utf8"
            )
          ),
          name: `${i + 1}`,
        })
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

  // // TODO: Modify metadata
  async regenerateItems(generation: Generation, items: Collection) {
    let { name, collection } = generation;

    const newItems: Collection = items.map(({ name, traits }) => ({
      name,
      traits: traits.map((trait) =>
        choose(this.traitsByLayerName.get(trait.name))
      ),
    }));
    await this.generateImages({ name, collection: newItems } as Generation);

    for (const item of items) {
      await fs.promises.writeFile(
        path.join(this.buildDir, "json", name, `${item.name}.json`),
        JSON.stringify({
          ...JSON.parse(
            await fs.promises.readFile(
              path.join(this.buildDir, "json", name, `${item.name}.json`),
              "utf8"
            )
          ),
          attributes: item.traits.map((trait) => ({
            trait_type: trait.name,
            value: trait.value,
          })),
        })
      );
    }

    const newCollectionItemsByName = new Map(
      newItems.map((item) => [item.name, item])
    );
    collection = collection.map((collectionItem) =>
      newCollectionItemsByName.has(collectionItem.name)
        ? newCollectionItemsByName.get(collectionItem.name)
        : collectionItem
    );
    return {
      ...generation,
      collection,
    };
  }

  async replaceItems(generation: Generation, _with: Collection) {
    let { name, collection } = generation;

    await this.generateImages({ name, collection: _with } as Generation);

    for (const item of _with) {
      await fs.promises.writeFile(
        path.join(this.buildDir, "json", name, `${item.name}.json`),
        JSON.stringify({
          ...JSON.parse(
            await fs.promises.readFile(
              path.join(this.buildDir, "json", name, `${item.name}.json`),
              "utf8"
            )
          ),
          attributes: item.traits.map((trait) => ({
            trait_type: trait.name,
            value: trait.value,
          })),
        })
      );
    }

    const newCollectionItemsByName = new Map(
      _with.map((item) => [item.name, item])
    );
    collection = collection.map((collectionItem) =>
      newCollectionItemsByName.has(collectionItem.name)
        ? newCollectionItemsByName.get(collectionItem.name)
        : collectionItem
    );
    return {
      ...generation,
      collection,
    };
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

        await fs.promises.writeFile(
          path.join(this.buildDir, "json", name, `${i}.json`),
          JSON.stringify({
            ...JSON.parse(
              await fs.promises.readFile(
                path.join(
                  this.buildDir,
                  "json",
                  name,
                  `${collectionItem.name}.json`
                ),
                "utf8"
              )
            ),
            name: `${i}`,
          })
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

    return { name, collection: unifiedCollection, bundles: unifiedBundles };
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

// const onCost = async () => {
//   const cost = await contract.cost();
//   addOutput({
//     title: "Cost",
//     text: utils.formatUnits(cost.toString(), "ether"),
//     isCopiable: true,
//   });
// };

// const onBalanceOf = async ({ address }) => {
//   if (!address) return;
//   const balance = await contract.balanceOf(address);
//   addOutput({
//     title: `Balance of ${chopAddress(address)}`,
//     text: balance.toString(),
//     isCopiable: true,
//   });
// };

// const onTokenOfOwnerByIndex = async ({ address, index }) => {
//   if (!address || !index) return;
//   const n = await contract.tokenOfOwnerByIndex(address, index);
//   addOutput({
//     title: "Token of owner by index",
//     text: n.toString(),
//     isCopiable: true,
//   });
// };

// const onTokenURI = async ({ index }) => {
//   if (!index) return;
//   const uri = await contract.tokenURI(index);
//   addOutput({
//     title: "Token URI",
//     text: uri,
//     isCopiable: true,
//   });
// };

// const onMint = async ({ payable, mint }) => {
//   if (!payable || !mint) return;
//   let tx = await contract.mint(mint, {
//     value: utils.parseEther(payable),
//   });
//   await tx.wait();
//   addOutput({
//     title: "Minted",
//     text: mint.toString(),
//     isCopiable: true,
//   });
// };

// const onSetCost = async ({ cost }) => {
//   if (!cost) return;
//   let tx = await contract.setCost(utils.parseEther(cost));
//   await tx.wait();
//   addOutput({
//     title: "Cost set",
//     text: cost.toString(),
//     isCopiable: true,
//   });
// };

// const onSetMaxMintAmount = async ({ amount }) => {
//   if (!amount) return;
//   let tx = await contract.setMaxMintAmount(utils.parseEther(amount));
//   await tx.wait();
//   addOutput({
//     title: "Max mint amount set",
//     text: amount.toString(),
//     isCopiable: true,
//   });
// };

// const onWithdraw = async () => {
//   const tx = await contract.withdraw();
//   await tx.wait();
//   addOutput({
//     title: "Withdrawn",
//     text: "true",
//     isCopiable: true,
//   });
// };

// const onSell = async () => {
//   const expirationTime = Math.round(Date.now() / 1000 + 60 * 60 * 24);
//   const auction = await seaport.createSellOrder({
//     expirationTime,
//     accountAddress: "0xa4BfC85ad65428E600864C9d6C04065670996c1e",
//     startAmount: 1,
//     asset: {
//       tokenId: "1",
//       tokenAddress: contract.address,
//     },
//   });
//   addOutput({
//     title: "Sell order created",
//     text: "true",
//     isCopiable: true,
//   });
// };
