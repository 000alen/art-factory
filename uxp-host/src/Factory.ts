import { ContractFactory, providers as ethersProviders, utils } from "ethers";
import fs from "fs";
import imageSize from "image-size";
import path from "path";
import sharp, { Blend } from "sharp";
import { v4 as uuid } from "uuid";

import {
  BUILD_DIR_NAME,
  DEFAULT_BLENDING,
  DEFAULT_OPACITY,
  MAIN_WETH,
  RINKEBY_WETH,
} from "./constants";
import { accounts, contracts, providers, seaports } from "./ipc";
import {
  Bundles,
  BundlesInfo,
  Collection,
  CollectionItem,
  Configuration,
  Deployment,
  Drop,
  Generation,
  Layer,
  MetadataItem,
  SaleType,
  Secrets,
  Template,
  Trait,
} from "./typings";
import {
  append,
  arrayDifference,
  choose,
  computeBundlesNs,
  computeTraitsNs,
  getBranches,
  getContract,
  hash,
  pinDirectoryToIPFS,
  pinFileToIPFS,
  rarity,
  readDir,
  removeRarity,
  replaceAll,
  restrictImage,
} from "./utils";

interface LayerNodeComponentData {
  urls?: Record<string, string>;
  trait: Trait;
  id: string;
  name: string;
  opacity: number;
  blending: string;
}

export class Factory {
  buildDir: string;
  imagesDir: string;
  jsonDir: string;
  layerByName: Map<string, Layer>;
  traitsByLayerName: Map<string, Trait[]>;
  traitsBuffer: Map<string, Buffer>;
  secrets: Secrets;

  constructor(public configuration: Configuration, public projectDir: string) {
    this.buildDir = path.join(this.projectDir, BUILD_DIR_NAME);
    this.imagesDir = path.join(this.buildDir, "images");
    this.jsonDir = path.join(this.buildDir, "json");
    this.layerByName = new Map();
    this.traitsByLayerName = new Map();
    this.traitsBuffer = new Map();

    this._ensureBuildDir();
    this._ensureLayers();
  }

  layer(layerName: string) {
    return path.join(this.projectDir, layerName);
  }

  image(generationName: string, name?: string) {
    return name
      ? path.join(this.imagesDir, generationName, `${name}.png`)
      : path.join(this.imagesDir, generationName);
  }

  json(generationName: string, name?: string) {
    return name
      ? path.join(this.jsonDir, generationName, `${name}.json`)
      : path.join(this.jsonDir, generationName);
  }

  async updateJson(
    generationName: string,
    name: string,
    obj: Record<string, any>,
    fromGenerationName?: string,
    fromName?: string
  ) {
    await fs.promises.writeFile(
      this.json(generationName, name),
      JSON.stringify({
        ...JSON.parse(
          await fs.promises.readFile(
            this.json(fromGenerationName || generationName, fromName || name),
            "utf8"
          )
        ),
        ...obj,
      })
    );
  }

  async renameImage(generationName: string, prev: string, _new: string) {
    await fs.promises.rename(
      this.image(generationName, prev),
      this.image(generationName, _new)
    );
  }

  async renameJson(generationName: string, prev: string, _new: string) {
    await fs.promises.rename(
      this.json(generationName, prev),
      this.json(generationName, _new)
    );
  }

  private _ensureBuildDir() {
    if (!fs.existsSync(this.buildDir)) fs.mkdirSync(this.buildDir);
    if (!fs.existsSync(this.imagesDir)) fs.mkdirSync(this.imagesDir);
    if (!fs.existsSync(this.jsonDir)) fs.mkdirSync(this.jsonDir);
  }

  private async _ensureLayers() {
    const layersNames = await readDir(this.projectDir);

    const layers: Layer[] = layersNames.map((layerName) => ({
      basePath: this.layer(layerName),
      name: layerName,
      blending: DEFAULT_BLENDING,
      opacity: DEFAULT_OPACITY,
    }));

    const nTraitsNames = await Promise.all(
      layersNames.map((layerName) => readDir(this.layer(layerName)))
    );

    const traitsByLayerIndex: Trait[][] = nTraitsNames.map((traitsNames, i) =>
      traitsNames.map((traitName) => {
        const { name, ext } = path.parse(traitName);
        return {
          ...layers[i],
          fileName: traitName,
          value: removeRarity(name),
          rarity: rarity(name),
          type: ext.slice(1),
        };
      })
    );

    layersNames.forEach((layerPath, i) => {
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

  async getResolution() {
    const layerFolder = (await readDir(this.projectDir))[0];
    const layerPath = path.join(this.projectDir, layerFolder);
    const traitName = (await readDir(layerPath))[0];
    const traitPath = path.join(layerPath, traitName);
    const traitBuffer = await fs.promises.readFile(traitPath);
    const { width, height } = imageSize(traitBuffer);
    return { width, height };
  }

  getLayerByName(layerName: string) {
    return this.layerByName.get(layerName);
  }

  getTraitsByLayerName(layerName: string) {
    return this.traitsByLayerName.get(layerName);
  }

  makeGeneration(name: string, template: Template): Generation {
    // #region Helper functions
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
      for (let traits of _nTraits)
        for (const trait of traits)
          cache[trait.id] = computeNTraits(trait, _traitsNs[trait.id]);
      return cache;
    };
    // #endregion

    const {
      nodes,
      edges,
      ns,
      ignored,
      salesTypes,
      startingPrices,
      endingPrices,
      salesTimes,
    } = template;

    // #region Data preparation
    const nData = getBranches(nodes, edges)
      .map((branch) => branch.slice(1, -1))
      .map((branch) => branch.map((node) => node.data));

    let keys = nData
      .map((branch) => branch.map(({ trait, id }) => ({ ...trait, id })))
      .map(hash);

    const nTraits: Trait[][] = nData
      .map((branch) =>
        branch.map(({ trait, id, opacity, blending }) => ({
          ...trait,
          id,
          opacity,
          blending,
        }))
      )
      .filter((_, i) => !ignored.includes(keys[i]));

    keys = keys.filter((key) => !ignored.includes(key));

    const bundlesInfo: BundlesInfo = nodes
      .filter((node) => node.type === "bundleNode")
      .map((node) => node.data)
      .map(({ name, ids, saleType, startingPrice, endingPrice, saleTime }) => ({
        name,
        ids,
        saleType,
        startingPrice,
        endingPrice,
        saleTime,
      }));
    // #endregion

    const traitsNs = computeTraitsNs(nTraits, ns, keys);
    const bundlesNs = computeBundlesNs(bundlesInfo, ns);
    const cache = computeCache(nTraits, traitsNs);

    const collection: Collection = [];
    const bundles: Bundles = [];
    const drops: Drop[] = [];

    let c = 1;
    for (const [i, traits] of nTraits.entries()) {
      const n = ns[keys[i]];
      const saleType = salesTypes[keys[i]];
      const startingPrice = startingPrices[keys[i]];
      const endingPrice = endingPrices[keys[i]];
      const saleTime = salesTimes[keys[i]];

      const nTraits = traits.reduce(
        (prevNTraits, trait) =>
          prevNTraits.map((traits, j) => [...traits, cache[trait.id][j]]),
        Array.from({ length: n }, () => [])
      );

      const items = nTraits.map((traits) => ({
        name: `${c++}`,
        traits,
        saleType,
        startingPrice,
        endingPrice,
        saleTime,
      }));

      const bundleInfo = bundlesInfo.find(({ ids }) => ids.includes(keys[i]));

      if (bundleInfo !== undefined) {
        let bundle;
        if (bundles.some((b) => b.name === bundleInfo.name)) {
          bundle = bundles.find((b) => b.name === bundleInfo.name);
        } else {
          bundle = {
            name: bundleInfo.name,
            ids: Array.from({ length: bundlesNs[bundleInfo.name] }, () => []),
            saleType: bundleInfo.saleType,
            startingPrice: bundleInfo.startingPrice,
            endingPrice: bundleInfo.endingPrice,
            saleTime: bundleInfo.saleTime,
          };
          bundles.push(bundle);
        }

        bundle.ids = append(
          bundle.ids,
          items
            .map((item) => item.name)
            .slice(0, bundlesNs[bundleInfo.name])
            .map((name) => [name])
        );
      }

      collection.push(...items);
    }

    drops.push({
      name,
      ids: collection.map(({ name }) => name),
      bundles: bundles.map(({ name }) => name),
    });

    return {
      id: uuid(),
      name,
      collection,
      bundles,
      drops,
    };
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

  async generateImage(generation: Generation, item: CollectionItem) {
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
      .toFile(this.image(generation.name, item.name));
  }

  async generateImages(
    generation: Generation,
    callback?: (name: string) => void
  ) {
    const { name, collection } = generation;
    if (!fs.existsSync(this.image(name))) fs.mkdirSync(this.image(name));

    await Promise.all(
      collection.map(async (item) => {
        await this.generateImage(generation, item);
        if (callback) callback(item.name);
      })
    );
  }

  async generateMetadata(
    generation: Generation,
    metadataItems: MetadataItem[],
    callback?: (name: string) => void
  ) {
    const { name, collection } = generation;

    if (!fs.existsSync(this.json(name))) fs.mkdirSync(this.json(name));

    for (const item of collection) {
      const metadata: any = {
        name: this.configuration.name,
        description: this.configuration.description,
        image: `ipfs://<unknown>/${item.name}.png`,
        edition: item.name,
        date: Date.now(),
        attributes: item.traits.map((trait) => ({
          trait_type: trait.name,
          value: trait.value,
        })),
      };

      for (const { key, value } of metadataItems)
        metadata[key] = replaceAll(value, /\${name}/, item.name);

      await fs.promises.writeFile(
        this.json(name, item.name),
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

    if (!fs.existsSync(this.json(name))) fs.mkdirSync(this.json(name));

    await Promise.all(
      collection.map((item) =>
        this.updateJson(name, item.name, {
          image: `ipfs://${imagesCid}/${item.name}.png`,
        })
      )
    );
  }

  async hydrateNotRevealedMetadata(
    generation: Generation,
    notRevealedImageCid: string,
    callback?: (name: string) => void
  ) {
    const { name } = generation;

    if (!fs.existsSync(this.json(name))) fs.mkdirSync(this.json(name));

    await this.updateJson(name, "1", {
      image: `ipfs://${notRevealedImageCid}/`,
    });
  }

  // #region IPFS Deployment
  async deployNotRevealedImage(generation: Generation) {
    const { IpfsHash } = await pinFileToIPFS(
      this.secrets.pinataApiKey,
      this.secrets.pinataSecretApiKey,
      this.image(generation.name, "1") // ? Hardcoded
    );
    return IpfsHash;
  }

  async deployNotRevealedMetadata(generation: Generation) {
    const { IpfsHash } = await pinFileToIPFS(
      this.secrets.pinataApiKey,
      this.secrets.pinataSecretApiKey,
      this.json(generation.name, "1") // ? Hardcoded
    );
    return IpfsHash;
  }

  async deployImages(generation: Generation) {
    const { IpfsHash } = await pinDirectoryToIPFS(
      this.secrets.pinataApiKey,
      this.secrets.pinataSecretApiKey,
      this.image(generation.name)
    );
    return IpfsHash;
  }

  async deployMetadata(generation: Generation) {
    const { IpfsHash } = await pinDirectoryToIPFS(
      this.secrets.pinataApiKey,
      this.secrets.pinataSecretApiKey,
      this.json(generation.name)
    );
    return IpfsHash;
  }
  // #endregion

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
    if (this.configuration.contractType === "721_reveal_pause")
      await this.hydrateNotRevealedMetadata(
        notRevealedGeneration,
        notRevealedImageCid
      );
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
      generation.collection.length
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
      generation.collection.length
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

  // #region Getters
  async getTraitImage(trait: Trait, maxSize?: number) {
    return await restrictImage(
      this.traitsBuffer.get(await this._ensureTraitBuffer(trait)),
      maxSize
    );
  }

  async getRandomTraitImage(layer: Layer, maxSize?: number) {
    const trait = choose(this.traitsByLayerName.get(layer.name));
    return [trait, await this.getTraitImage(trait, maxSize)];
  }

  async getImage(
    generation: Generation,
    item: CollectionItem,
    maxSize?: number
  ) {
    return await restrictImage(
      await fs.promises.readFile(this.image(generation.name, item.name)),
      maxSize
    );
  }

  async getRandomImage(generation: Generation, maxSize?: number) {
    const item =
      generation.collection[
        Math.floor(Math.random() * generation.collection.length)
      ];
    return [item, await this.getImage(generation, item, maxSize)];
  }

  async getMetadata(generation: Generation, item: CollectionItem) {
    return JSON.parse(
      await fs.promises.readFile(this.json(generation.name, item.name), "utf8")
    );
  }

  async getRandomMetadata(generation: Generation) {
    const item =
      generation.collection[
        Math.floor(Math.random() * generation.collection.length)
      ];
    return [item, await this.getMetadata(generation, item)];
  }
  // #endregion

  async removeItems(
    generation: Generation,
    items: Collection,
    filesAlreadyRemoved: boolean = false
  ): Promise<Generation> {
    const { name, collection, bundles, drops } = generation;

    if (!filesAlreadyRemoved)
      await Promise.all(
        items.reduce(
          (p, item) => [
            ...p,
            fs.promises.rm(this.image(name, item.name)),
            fs.promises.rm(this.json(name, item.name)),
          ],
          []
        )
      );

    let intermidiateCollection = collection.filter(
      (item) => !items.some((itemToRemove) => item.name === itemToRemove.name)
    );

    let intermidiateBundles = bundles.map(({ ids, ...rest }) => ({
      ...rest,
      ids: ids.filter(
        (ids) => !ids.some((id) => items.some((item) => item.name === id))
      ),
    }));

    let intermidiateDrops = drops.map(({ name, ids }) => ({
      name,
      ids: ids.filter((id) => items.some((item) => item.name === id)),
      bundles: bundles.map(({ name }) => name),
    }));

    // ? First pass
    for (const [i, item] of intermidiateCollection.entries()) {
      const _from = item.name;
      const _to = `_${i + 1}`;

      await this.renameImage(name, _from, _to);
      await this.updateJson(name, _from, {
        edition: `${i + 1}`,
      });
      await this.renameJson(name, _from, _to);

      intermidiateBundles = intermidiateBundles.map(({ ids, ...rest }) => ({
        ...rest,
        ids: ids.map((_ids) =>
          _ids.includes(_from)
            ? _ids.map((id) => (id === _from ? _to : id))
            : _ids
        ),
      }));

      intermidiateDrops = intermidiateDrops.map(({ ids, ...rest }) => ({
        ...rest,
        ids: ids.includes(_from)
          ? ids.map((id) => (id === _from ? _to : id))
          : ids,
      }));

      item.name = `${i + 1}`;
    }

    // ? Second pass
    for (let i = 0; i < intermidiateCollection.length; i++) {
      const _from = `_${i + 1}`;
      const _to = `${i + 1}`;

      await this.renameImage(name, _from, _to);
      await this.renameJson(name, _from, _to);

      intermidiateBundles = intermidiateBundles.map(({ ids, ...rest }) => ({
        ...rest,
        ids: ids.map((_ids) =>
          _ids.includes(_from)
            ? _ids.map((id) => (id === _from ? _to : id))
            : _ids
        ),
      }));

      intermidiateDrops = intermidiateDrops.map(({ ids, ...rest }) => ({
        ...rest,
        ids: ids.includes(_from)
          ? ids.map((id) => (id === _from ? _to : id))
          : ids,
      }));
    }

    return {
      ...generation,
      collection: intermidiateCollection,
      bundles: intermidiateBundles,
      drops: intermidiateDrops,
    };
  }

  async regenerateItems(generation: Generation, items: Collection) {
    const { name, collection } = generation;

    const newItems: Collection = items.map(({ traits, ...rest }) => ({
      ...rest,
      traits: traits.map((trait) =>
        choose(this.traitsByLayerName.get(trait.name))
      ),
    }));
    await this.generateImages({ name, collection: newItems } as Generation);

    await Promise.all(
      items.map((item) =>
        this.updateJson(name, item.name, {
          attributes: item.traits.map((trait) => ({
            trait_type: trait.name,
            value: trait.value,
          })),
        })
      )
    );

    const newItemsByName = new Map(newItems.map((item) => [item.name, item]));

    const newCollection = collection.map((item) =>
      newItemsByName.has(item.name) ? newItemsByName.get(item.name) : item
    );

    return {
      ...generation,
      collection: newCollection,
    };
  }

  async replaceItems(generation: Generation, _with: Collection) {
    const { name, collection } = generation;

    await this.generateImages({ name, collection: _with } as Generation);

    await Promise.all(
      _with.map((item) =>
        this.updateJson(name, item.name, {
          attributes: item.traits.map((trait) => ({
            trait_type: trait.name,
            value: trait.value,
          })),
        })
      )
    );

    const newItemsByName = new Map(_with.map((item) => [item.name, item]));
    const newCollection = collection.map((item) =>
      newItemsByName.has(item.name) ? newItemsByName.get(item.name) : item
    );

    return {
      ...generation,
      collection: newCollection,
    };
  }

  async unify(name: string, generations: Generation[]) {
    if (!fs.existsSync(this.image(name))) fs.mkdirSync(this.image(name));
    if (!fs.existsSync(this.json(name))) fs.mkdirSync(this.json(name));

    const unifiedCollection: Collection = [];
    const unifiedBundles: Bundles = [];
    const unifiedDrops: Drop[] = [];

    let i = 1;
    for (const {
      name: currentName,
      collection,
      bundles,
      drops,
    } of generations) {
      const mappings: Record<string, string> = {};

      for (const item of collection) {
        mappings[item.name] = `${i}`;

        await fs.promises.copyFile(
          this.image(currentName, item.name),
          this.image(name, `${i}`)
        );

        this.updateJson(
          name,
          `${i}`,
          {
            edition: `${i}`,
          },
          currentName,
          item.name
        );

        unifiedCollection.push({
          ...item,
          name: `${i++}`,
        });
      }

      unifiedBundles.push(
        ...bundles.map(({ ids, ...rest }) => ({
          ...rest,
          ids: ids.map((_ids) => _ids.map((id) => mappings[id])),
        }))
      );

      unifiedDrops.push(
        ...drops.map(({ name, ids }) => ({
          name,
          ids: ids.map((id) => mappings[id]),
          bundles: bundles.map(({ name }) => name),
        }))
      );
    }

    return {
      name,
      collection: unifiedCollection,
      bundles: unifiedBundles,
      drops: unifiedDrops,
    };
  }

  async remove(generation: Generation) {
    await fs.promises.rm(this.image(generation.name), {
      recursive: true,
      force: true,
    });
    await fs.promises.rm(this.json(generation.name), {
      recursive: true,
      force: true,
    });
  }

  async reconstruct(generation: Generation) {
    const names = (await readDir(this.image(generation.name))).map(
      (name) => path.parse(name).name
    );

    const items = generation.collection.filter(
      (item) => !names.includes(item.name)
    );

    await Promise.all(
      items.map((item) => fs.promises.rm(this.json(generation.name, item.name)))
    );

    return await this.removeItems(generation, items, true);
  }

  async getBalanceOf(contractId: string, address: string) {
    const contract = contracts[contractId];
    const balance = await contract.balanceOf(address);
    return balance;
  }

  async getTokenOfOwnerByIndex(
    contractId: string,
    address: string,
    index: number
  ) {
    const contract = contracts[contractId];
    const id = await contract.tokenOfOwnerByIndex(address, index);
    return id;
  }

  async getTokenUri(contractId: string, index: number) {
    const contract = contracts[contractId];
    const uri = await contract.tokenURI(index);
    return uri;
  }

  // ? NOTE: Might have to manually set the nonce
  async mint(contractId: string, payable: string, mint: number) {
    const contract = contracts[contractId];
    const tx = await contract.mint(mint, {
      value: utils.parseEther(payable),
    });
    await tx.wait();
  }

  async getWalletOfOwner(contractId: string, owner: string) {
    const contract = contracts[contractId];
    const wallet = await contract.walletOfOwner(owner);
    return wallet;
  }

  async withdraw(contractId: string) {
    const contract = contracts[contractId];
    const tx = await contract.withdraw();
    await tx.wait();
  }
  // #endregion

  // #region 721_reveal_pause
  async pause(contractId: string) {
    const contract = contracts[contractId];
    const tx = await contract.pause();
    await tx.wait();
  }

  async setBaseUri(contractId: string, baseUri: string) {
    const contract = contracts[contractId];
    const tx = await contract.setBaseUri(baseUri);
    await tx.wait();
  }

  async reveal(contractId: string) {
    const contract = contracts[contractId];
    const tx = await contract.reveal();
    await tx.wait();
  }
  // #endregion

  async mintDrop(providerId: string, contractId: string, drop: Drop) {
    const contract = contracts[contractId];
    const n = drop.ids.length;
    const tx = await contract.mint(n);
    await tx.wait();
  }

  async sellDropBundles(
    providerEngineId: string,
    deployment: Deployment,
    drop: Drop
  ) {
    const seaport = seaports[providerEngineId];

    const { generation, contractAddress } = deployment;
    const { bundles } = generation;

    const publishedIds = [];
    for (const bundleName of drop.bundles) {
      const bundle = bundles.find((bundle) => bundle.name === bundleName);

      for (const _ids of bundle.ids) {
        const assets = _ids.map((id) => ({
          tokenId: id,
          tokenAddress: contractAddress,
        }));

        switch (bundle.saleType) {
          case SaleType.FIXED:
            await seaport.createBundleSellOrder({
              assets,
              bundleName,
              accountAddress: accounts[providerEngineId],
              startAmount: bundle.startingPrice,
            });
            break;
          case SaleType.DUTCH:
            await seaport.createBundleSellOrder({
              assets,
              bundleName,
              accountAddress: accounts[providerEngineId],
              startAmount: bundle.startingPrice,
              endAmount: bundle.endingPrice,
              expirationTime: Math.floor(Date.now() / 1000 + bundle.saleTime),
            });
            break;
          case SaleType.ENGLISH: // ? NOTE: Must use WETH
            await seaport.createBundleSellOrder({
              assets,
              bundleName,
              accountAddress: accounts[providerEngineId],
              paymentTokenAddress:
                deployment.network === "rinkeby" ? RINKEBY_WETH : MAIN_WETH,
              startAmount: bundle.startingPrice,
              endAmount: bundle.endingPrice,
              expirationTime: Math.floor(Date.now() / 1000 + bundle.saleTime),
              waitForHighestBid: true,
            });
            break;
        }

        publishedIds.push(..._ids);
      }
    }

    return publishedIds;
  }

  async sellDropItems(
    providerEngineId: string,
    deployment: Deployment,
    drop: Drop,
    publishedIds: string[] = []
  ) {
    const seaport = seaports[providerEngineId];

    const { generation, contractAddress } = deployment;
    const { collection } = generation;

    for (const id of arrayDifference(drop.ids, publishedIds)) {
      const item = collection.find((item) => item.name === id);

      const asset = {
        tokenId: id,
        tokenAddress: contractAddress,
      };

      switch (item.saleType) {
        case SaleType.FIXED:
          await seaport.createSellOrder({
            asset,
            accountAddress: accounts[providerEngineId],
            startAmount: item.startingPrice,
          });
          break;
        case SaleType.DUTCH:
          await seaport.createSellOrder({
            asset,
            accountAddress: accounts[providerEngineId],
            startAmount: item.startingPrice,
            endAmount: item.endingPrice,
            expirationTime: Math.floor(Date.now() / 1000 + item.saleTime),
          });
          break;
        case SaleType.ENGLISH: // ? NOTE: Must use WETH
          await seaport.createSellOrder({
            asset,
            accountAddress: accounts[providerEngineId],
            paymentTokenAddress:
              deployment.network === "rinkeby" ? RINKEBY_WETH : MAIN_WETH,
            startAmount: item.startingPrice,
            expirationTime: Math.floor(Date.now() / 1000 + item.saleTime),
            waitForHighestBid: true,
          });
          break;
      }
    }
  }

  async sellDrop(providerEngineId: string, deployment: Deployment, drop: Drop) {
    const publishedIds = await this.sellDropBundles(
      providerEngineId,
      deployment,
      drop
    );
    await this.sellDropItems(providerEngineId, deployment, drop, publishedIds);
  }
}
