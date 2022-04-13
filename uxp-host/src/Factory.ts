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
  Trait,
} from "./typings";
import {
  append,
  choose,
  pinDirectoryToIPFS,
  pinFileToIPFS,
  rarity,
  readDir,
  removeRarity,
  replaceAll,
  restrictImage,
} from "./utils";
import {
  BUILD_DIR_NAME,
  DEFAULT_BLENDING,
  DEFAULT_OPACITY,
  COLLECTION_DIR_NAME,
} from "./constants";

export class Factory {
  buildDir: string;

  layerByName: Map<string, Layer>;
  traitsByLayerName: Map<string, Trait[]>;
  traitsBuffer: Map<string, Buffer>;

  secrets: Secrets;

  imagesCid: string;
  notRevealedImageCid: string;
  metadataCid: string;
  notRevealedMetadataCid: string;

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

    if (!fs.existsSync(path.join(this.buildDir, "images", COLLECTION_DIR_NAME)))
      fs.mkdirSync(path.join(this.buildDir, "images", COLLECTION_DIR_NAME));

    if (!fs.existsSync(path.join(this.buildDir, "json", COLLECTION_DIR_NAME)))
      fs.mkdirSync(path.join(this.buildDir, "json", COLLECTION_DIR_NAME));

    if (!fs.existsSync(path.join(this.buildDir, "json")))
      fs.mkdirSync(path.join(this.buildDir, "json"));

    if (!fs.existsSync(path.join(this.buildDir, "not_revealed")))
      fs.mkdirSync(path.join(this.buildDir, "not_revealed"));
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

  reloadLayers() {
    // this.layerByName.clear();
    // this.traitsByLayerName.clear();
    // this.traitsBuffer.clear();
    this._ensureLayers();
  }

  getLayerByName(layerName: string) {
    return this.layerByName.get(layerName);
  }

  getTraitsByLayerName(layerName: string) {
    return this.traitsByLayerName.get(layerName);
  }

  generateCollection(
    keys: string[],
    nTraits: Trait[][],
    branchesNs: Record<string, number>,
    bundlesInfo: BundlesInfo
  ) {
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

    const traitsNs = computeTraitsNs(nTraits, branchesNs);
    const bundlesNs = computeBundlesNs(bundlesInfo, branchesNs);
    const cache = computeCache(nTraits, traitsNs);
    const collection: Collection = [];
    const bundles: Bundles = [];

    let i = 1;
    for (const [index, traits] of nTraits.entries()) {
      const n = branchesNs[keys[index]];

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

    return { collection, bundles };
  }

  async generateNotRevealedImage(traits: Trait[]) {
    const item = {
      name: "not_revealed",
      traits: traits.map((trait) =>
        choose(this.traitsByLayerName.get(trait.name))
      ),
    };
    await this.generateImage(item, "not_revealed");
  }

  async generateNotRevealedMetadata() {
    const metadata = {
      name: this.configuration.name,
      description: this.configuration.description,
      image: `ipfs://${this.notRevealedImageCid}`,
      edition: "not_revealed",
      date: Date.now(),
    };

    await fs.promises.writeFile(
      path.join(this.buildDir, "not_revealed", `not_revealed.json`),
      JSON.stringify(metadata)
    );
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

  async generateImage(
    collectionItem: CollectionItem,
    folder: string = "images"
  ) {
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
          : {
              r: this.configuration.defaultBackground.r,
              g: this.configuration.defaultBackground.g,
              b: this.configuration.defaultBackground.b,
              alpha: this.configuration.defaultBackground.a,
            },
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
      .toFile(path.join(this.buildDir, folder, `${collectionItem.name}.png`));
  }

  async generateImages(
    name: string,
    collection: Collection,
    callback?: (name: string) => void
  ) {
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
    name: string,
    collection: Collection,
    metadataItems: MetadataItem[],
    callback?: (name: string) => void
  ) {
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
    name: string,
    collection: Collection,
    callback?: (name: string) => void
  ) {
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
      metadata["image"] = `ipfs://${this.imagesCid}/${collectionItem.name}.png`;

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

  async deployImages() {
    if (this.imagesCid) return this.imagesCid;

    const imagesDir = path.join(this.buildDir, "images");

    const { IpfsHash } = await pinDirectoryToIPFS(
      this.secrets.pinataApiKey,
      this.secrets.pinataSecretApiKey,
      imagesDir
    );
    this.imagesCid = IpfsHash;

    return this.imagesCid;
  }

  async deployNotRevealedImage() {
    if (this.notRevealedImageCid) return this.notRevealedImageCid;

    const notRevealedDir = path.join(this.buildDir, "not_revealed");

    const { IpfsHash } = await pinFileToIPFS(
      this.secrets.pinataApiKey,
      this.secrets.pinataSecretApiKey,
      path.join(notRevealedDir, "not_revealed.png")
    );

    this.notRevealedImageCid = IpfsHash;

    return this.notRevealedImageCid;
  }

  async deployMetadata() {
    if (this.metadataCid) return this.metadataCid;

    if (!this.imagesCid) return;

    const jsonDir = path.join(this.buildDir, "json");

    const { IpfsHash } = await pinDirectoryToIPFS(
      this.secrets.pinataApiKey,
      this.secrets.pinataSecretApiKey,
      jsonDir
    );
    this.metadataCid = IpfsHash;

    return this.metadataCid;
  }

  async deployNotRevealedMetadata() {
    if (this.notRevealedMetadataCid) return this.notRevealedMetadataCid;

    const notRevealedDir = path.join(this.buildDir, "not_revealed");

    const { IpfsHash } = await pinFileToIPFS(
      this.secrets.pinataApiKey,
      this.secrets.pinataSecretApiKey,
      path.join(notRevealedDir, "not_revealed.json")
    );

    this.notRevealedMetadataCid = IpfsHash;

    return this.notRevealedMetadataCid;
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

  async getImage(
    name: string,
    collectionItem: CollectionItem,
    maxSize?: number
  ) {
    const buffer = await restrictImage(
      await fs.promises.readFile(
        path.join(this.buildDir, "images", name, `${collectionItem.name}.png`)
      ),
      maxSize
    );
    return buffer;
  }

  async getRandomImage(name: string, collection: Collection, maxSize?: number) {
    const collectionItem =
      collection[Math.floor(Math.random() * collection.length)];
    return [collectionItem, await this.getImage(name, collectionItem, maxSize)];
  }

  async rewriteImage(collectionItem: CollectionItem, dataUrl: string) {
    await fs.promises.writeFile(
      path.join(this.buildDir, "images", `${collectionItem.name}.png`),
      Buffer.from(dataUrl.replace(/^data:image\/png;base64,/, ""), "base64")
    );
  }

  async getMetadata(collectionItem: CollectionItem) {
    const metadata = await fs.promises.readFile(
      path.join(this.buildDir, "json", `${collectionItem.name}.json`)
    );
    return JSON.parse(metadata.toString());
  }

  async getRandomMetadata(name: string, collection: Collection) {
    const collectionItem =
      collection[Math.floor(Math.random() * collection.length)];
    return [collectionItem, await this.getMetadata(collectionItem)];
  }

  async removeCollectionItems(
    name: string,
    collection: Collection,
    bundles: Bundles,
    collectionItemsToRemove: Collection
  ) {
    await Promise.all(
      collectionItemsToRemove.map(async (itemToRemove) => {
        await fs.promises.rm(
          path.join(this.buildDir, "images", name, `${itemToRemove.name}.png`)
        );
        await fs.promises.rm(
          path.join(this.buildDir, "json", name, `${itemToRemove.name}.json`)
        );
      })
    );

    collection = collection.filter(
      (item) =>
        !collectionItemsToRemove.some((itemToRemove) => {
          return item.name === itemToRemove.name;
        })
    );

    bundles = bundles.map(({ name, ids }) => ({
      name,
      ids: ids.filter(
        (ids) =>
          !ids.some((id) =>
            collectionItemsToRemove.some((item) => item.name === id)
          )
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

  async regenerateCollectionItems(
    name: string,
    collection: Collection,
    collectionItemsToRegenerate: Collection
  ) {
    const newCollectionItems: Collection = collectionItemsToRegenerate.map(
      ({ name, traits }) => ({
        name,
        traits: traits.map((trait) =>
          choose(this.traitsByLayerName.get(trait.name))
        ),
      })
    );
    await this.generateImages(name, newCollectionItems);
    const newCollectionItemsByName = new Map(
      newCollectionItems.map((item) => [item.name, item])
    );
    collection = collection.map((collectionItem) =>
      newCollectionItemsByName.has(collectionItem.name)
        ? newCollectionItemsByName.get(collectionItem.name)
        : collectionItem
    );
    return collection;
  }

  async unify(generations: Generation[]) {
    const unifiedCollection: Collection = [];
    const unifiedBundles: Bundles = []; // ! TODO

    let i = 1;
    for (const { name, collection } of generations) {
      for (const collectionItem of collection) {
        await fs.promises.copyFile(
          path.join(
            this.buildDir,
            "images",
            name,
            `${collectionItem.name}.png`
          ),
          path.join(this.buildDir, "images", COLLECTION_DIR_NAME, `${i}.png`)
        );

        await fs.promises.copyFile(
          path.join(this.buildDir, "json", name, `${collectionItem.name}.json`),
          path.join(this.buildDir, "json", COLLECTION_DIR_NAME, `${i}.json`)
        );

        unifiedCollection.push({
          ...collectionItem,
          name: `${i}`,
        });

        i++;
      }
    }

    return { collection: unifiedCollection, bundles: unifiedBundles };
  }
}
