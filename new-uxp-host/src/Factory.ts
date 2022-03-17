import fs from "fs";
import path from "path";
import Jimp from "jimp";
import {
  randomColor,
  rarity,
  removeRarity,
  rarityWeightedChoice,
  pinDirectoryToIPFS,
  getPaths,
  reducePaths,
  computeNs,
  expandPathIfNeeded,
  append,
  composeImages,
} from "./utils";
import imageSize from "image-size";
import {
  Secrets,
  Configuration,
  Layer,
  Trait,
  Attributes,
  Instance,
  LayerNodeData,
  Element,
} from "./typings";

import {
  uniqueNamesGenerator,
  adjectives,
  colors,
  names,
} from "unique-names-generator";

const capitalizedName = uniqueNamesGenerator({
  dictionaries: [colors, adjectives, names],
  separator: " ",
  style: "capital",
}); // Red Big Winona

export const DEFAULT_BACKGROUND = "#ffffff";

export class Factory {
  secrets: Secrets;
  layers: Map<string, Layer[]>;
  layerElementsBuffers: Map<string, Buffer>;
  layerElementsPaths: Map<string, string>;
  attributes: Attributes;
  generated: boolean;
  metadataGenerated: boolean;
  imagesCID: string;
  metadataCID: string;
  network: string;
  contractAddress: string;
  abi: any[];
  compilerVersion: string;

  constructor(
    public configuration: Configuration,
    public inputDir: string,
    public outputDir: string
  ) {
    this.layers = new Map();
    this.layerElementsBuffers = new Map();
    this.layerElementsPaths = new Map();
  }

  async saveInstance() {
    await this.ensureOutputDir();
    const instancePath = path.join(this.outputDir, "instance.json");
    await fs.promises.writeFile(instancePath, JSON.stringify(this.instance));
    return instancePath;
  }

  // #region Properties
  maxCombinations(): number {
    return this.configuration.layers.reduce((accumulator, layer) => {
      return accumulator * this.layers.get(layer).length;
    }, 1);
  }

  instance(): Instance {
    return {
      inputDir: this.inputDir,
      outputDir: this.outputDir,
      configuration: this.configuration,
      attributes: this.attributes,
      generated: this.generated,
      metadataGenerated: this.metadataGenerated,
      imagesCID: this.imagesCID,
      metadataCID: this.metadataCID,
      network: this.network,
      contractAddress: this.contractAddress,
      abi: this.abi,
      compilerVersion: this.compilerVersion,
    };
  }
  // #endregion

  // #region Loaders
  loadProps(props: Partial<Instance>) {
    const {
      attributes,
      generated,
      metadataGenerated,
      imagesCID,
      metadataCID,
      network,
      contractAddress,
      abi,
      compilerVersion,
    } = props;
    if (attributes) this.attributes = attributes;
    if (generated) this.generated = generated;
    if (metadataGenerated) this.metadataGenerated = metadataGenerated;
    if (imagesCID) this.imagesCID = imagesCID;
    if (metadataCID) this.metadataCID = metadataCID;
    if (network) this.network = network;
    if (contractAddress) this.contractAddress = contractAddress;
    if (abi) this.abi = abi;
    if (compilerVersion) this.compilerVersion = compilerVersion;
  }

  // TODO
  loadSecrets(secrets: Partial<Secrets>) {
    const { pinataApiKey, pinataSecretApiKey, infuraId, etherscanApiKey } =
      secrets;
    this.secrets = {
      ...this.secrets,
      pinataApiKey,
      pinataSecretApiKey,
      infuraId,
      etherscanApiKey,
    };
  }
  // #endregion

  // #region Setup helpers
  async ensureOutputDir() {
    if (!fs.existsSync(this.outputDir)) fs.mkdirSync(this.outputDir);

    if (!fs.existsSync(path.join(this.outputDir, "json")))
      fs.mkdirSync(path.join(this.outputDir, "json"));

    if (!fs.existsSync(path.join(this.outputDir, "images")))
      fs.mkdirSync(path.join(this.outputDir, "images"));
  }

  async ensureLayers() {
    if (this.layers.size > 0) return;

    const layersNames = (await fs.promises.readdir(this.inputDir)).filter(
      (file) => !file.startsWith(".")
    );

    const layerElementsPaths = await Promise.all(
      layersNames.map(async (layerName) =>
        (
          await fs.promises.readdir(path.join(this.inputDir, layerName))
        ).filter((file) => !file.startsWith("."))
      )
    );

    const layersElements = layerElementsPaths.map((layerElementsPath) =>
      layerElementsPath.map((layerElementPath) => {
        const { name, ext } = path.parse(layerElementPath);
        return {
          name: removeRarity(name),
          rarity: rarity(name),
          type: ext.slice(1),
          blending: "normal", // Default blending
          opacity: 1, // Default opacity
        };
      })
    );

    layersNames.forEach((layerName, i) => {
      this.layers.set(layerName, layersElements[i]);

      layersElements[i].forEach((layerElements, j) => {
        this.layerElementsPaths.set(
          path.join(layerName, layerElements.name),
          path.join(layerName, layerElementsPaths[i][j])
        );
      });
    });
  }

  async ensureLayerElementBuffer(layerElementPath: string) {
    if (!this.layerElementsBuffers.has(layerElementPath)) {
      let buffer = await fs.promises.readFile(
        path.join(this.inputDir, layerElementPath)
      );
      // @ts-ignore
      let { width, height } = imageSize(buffer);
      if (
        width !== this.configuration.width ||
        height !== this.configuration.height
      ) {
        const image = await Jimp.read(buffer);
        image.resize(this.configuration.width, this.configuration.height);
        buffer = await image.getBufferAsync(Jimp.MIME_PNG);
      }
      this.layerElementsBuffers.set(layerElementPath, buffer);
    }
  }
  // #endregion

  // #region Attributes Generation
  generateRandomAttributesFromLayers(
    layers: LayerNodeData[],
    n: number,
    attributesCache: Map<string, Attributes>
  ): Attributes {
    if (n > this.maxCombinations())
      console.warn(
        `WARN: n > maxCombinations (${n} > ${this.maxCombinations})`
      );

    console.log(n);

    let attributes = Array.from({ length: n }, () => []);

    // @ts-ignore
    for (const { layer, blending, opacity, id } of layers) {
      if (attributesCache && id && attributesCache.has(id)) {
        attributes = append(attributes, attributesCache.get(id).slice(0, n));
      } else {
        for (let i = 0; i < n; i++) {
          const layerElements = this.layers.get(layer);
          const { name, rarity, type } = rarityWeightedChoice(layerElements);
          attributes[i].push({
            name: layer,
            value: name,
            rarity,
            type,
            blending: blending,
            opacity: opacity,
          });
        }
      }
    }

    return attributes;
  }

  generateRandomAttributesFromNodes(layersNodes: Element[]): Attributes {
    /** @type {(LayerNodeData | RenderNodeData)[][]} */ const paths = getPaths(
      layersNodes
    )
      .map((p) => p.slice(1))
      .map((p) =>
        p.map(
          // @ts-ignore
          (n) => n.data
        )
      )
      .sort((a, b) => a.length - b.length);

    this.configuration.n = paths.reduce(
      (acc, p) => acc + /** @type {RenderNodeData} */ p[p.length - 1].n,
      0
    );

    const [cache, reducedPaths] = reducePaths(paths);
    // @ts-ignore
    const ns = computeNs(cache, reducedPaths);

    const attributesCache = new Map();

    for (const [id, path] of cache) {
      const x = this.generateRandomAttributesFromLayers(
        // @ts-ignore
        expandPathIfNeeded(cache, path),
        ns.get(id),
        attributesCache
      );

      console.log(id, x);

      attributesCache.set(id, x);
    }

    const attributes = [];

    for (const path of reducedPaths) {
      const n = path.pop().n;

      const _attributes = this.generateRandomAttributesFromLayers(
        // @ts-ignore
        path,
        n,
        attributesCache
      );

      attributes.push(..._attributes);
    }

    this.attributes = attributes;

    return attributes;
  }
  // #endregion

  // #region Images Generation
  async generateImage(traits: Trait[], i: number) {
    const image = await Jimp.create(
      this.configuration.width,
      this.configuration.height,
      this.configuration.generateBackground
        ? randomColor()
        : this.configuration.defaultBackground || DEFAULT_BACKGROUND
    );

    for (const trait of traits) {
      const layerElementPath = this.layerElementsPaths.get(
        path.join(trait.name, trait.value)
      );
      await this.ensureLayerElementBuffer(layerElementPath);
      const current = await Jimp.read(
        this.layerElementsBuffers.get(layerElementPath)
      );
      composeImages(image, current, trait.blending, trait.opacity);
    }

    await image.writeAsync(path.join(this.outputDir, "images", `${i + 1}.png`));
  }

  // ! TODO: Careful with memory usage (algorithm complexity: O(n) to O(log n))
  async generateImages(attributes: Attributes, callback: (i: number) => void) {
    await Promise.all(
      attributes.map(async (traits, i) => {
        await this.generateImage(traits, i);
        if (callback !== undefined) callback(i + 1);
      })
    );
    this.generated = true;
  }
  // #endregion

  // #region Metadata Generation
  // ! TODO: https://docs.opensea.io/docs/metadata-standards
  async generateMetadata(cid: string, attributes: Attributes) {
    const metadatas = [];
    for (let i = 0; i < attributes.length; i++) {
      const traits = attributes[i];

      const metadata = {
        name: this.configuration.name,
        description: this.configuration.description,
        image: `ipfs://${cid}/${i + 1}.png`,
        edition: i + 1,
        date: Date.now(),
        attributes: traits.map((trait) => ({
          trait_type: trait.name,
          value: trait.value,
        })),
      };
      metadatas.push(metadata);

      await fs.promises.writeFile(
        path.join(this.outputDir, "json", `${i + 1}.json`),
        JSON.stringify(metadata)
      );
    }

    await fs.promises.writeFile(
      path.join(this.outputDir, "json", "metadata.json"),
      JSON.stringify(metadatas)
    );

    this.metadataGenerated = true;
  }
  // #endregion

  // #region Deployment
  // TODO: Extract?
  /**
   * @param {boolean} force
   * @returns {Promise<string>}
   */
  async deployImages(force = false) {
    if (this.imagesCID !== undefined && !force) {
      console.warn(
        `WARN: images have already been deployed to IPFS (cid: ${this.imagesCID})`
      );
      return this.imagesCID;
    }

    const imagesDir = path.join(this.outputDir, "images");

    const { IpfsHash } = await pinDirectoryToIPFS(
      this.secrets.pinataApiKey,
      this.secrets.pinataSecretApiKey,
      imagesDir
    );
    this.imagesCID = IpfsHash;

    return this.imagesCID;
  }

  // TODO: Extract?
  /**
   * @param {boolean} force
   * @returns {Promise<string>}
   */
  async deployMetadata(force = false) {
    if (this.metadataCID !== undefined && !force) {
      console.warn(
        `WARN: metadata has already been deployed to IPFS (cid: ${this.metadataCID})`
      );
      return this.metadataCID;
    }

    if (this.imagesCID === undefined)
      throw new Error("Images have not been deployed to IPFS");

    const jsonDir = path.join(this.outputDir, "json");

    const { IpfsHash } = await pinDirectoryToIPFS(
      this.secrets.pinataApiKey,
      this.secrets.pinataSecretApiKey,
      jsonDir
    );
    this.metadataCID = IpfsHash;

    return this.metadataCID;
  }
  // #endregion

  // #region Traits Images
  async getTraitImage(trait: Trait, maxSize: number) {
    const layerElementPath = this.layerElementsPaths.get(
      path.join(trait.name, trait.value)
    );

    await this.ensureLayerElementBuffer(layerElementPath);
    let buffer = this.layerElementsBuffers.get(layerElementPath);

    if (maxSize) {
      // @ts-ignore
      let { width, height } = imageSize(buffer);
      const ratio = Math.max(width, height) / maxSize;
      if (ratio > 1) {
        width = Math.floor(width / ratio);
        height = Math.floor(height / ratio);
        const current = await Jimp.read(buffer);
        current.resize(width, height);
        buffer = await current.getBufferAsync(Jimp.MIME_PNG);
      }
    }

    return buffer;
  }

  async getRandomTraitImage(layerName: string, maxSize: number) {
    const layerElements = this.layers.get(layerName);
    const {
      name: value,
      rarity,
      type,
      blending,
      opacity,
    } = rarityWeightedChoice(layerElements);
    return await this.getTraitImage(
      {
        name: layerName,
        value,
        rarity,
        type,
        blending,
        opacity,
      },
      maxSize
    );
  }
  // #endregion

  // #region Images
  async getRandomImage(attributes: Attributes, maxSize: number) {
    const index = Math.floor(Math.random() * attributes.length);
    return await this.getImage(index, maxSize);
  }

  async getImage(index: number, maxSize: number) {
    let buffer = fs.readFileSync(
      path.join(this.outputDir, "images", `${index + 1}.png`)
    );

    if (maxSize) {
      // @ts-ignore
      let { width, height } = imageSize(buffer);
      const ratio = Math.max(width, height) / maxSize;
      if (ratio > 1) {
        width = Math.floor(width / ratio);
        height = Math.floor(height / ratio);
        const current = await Jimp.read(buffer);
        current.resize(width, height);
        buffer = await current.getBufferAsync(Jimp.MIME_PNG);
      }
    }

    return buffer;
  }

  /**
   * @param {number} i
   * @param {string} dataUrl
   */
  async rewriteImage(i: number, dataUrl: string) {
    await fs.promises.writeFile(
      path.join(this.outputDir, "images", `${i + 1}.png`),
      Buffer.from(dataUrl.replace(/^data:image\/png;base64,/, ""), "base64")
    );
  }
  // #endregion
}

// ? For some reason, this function must remain inside this file,
// ? otherwise it doesn't work ("Factory is not a constructor").
export async function loadInstance(instancePath: string) {
  const { inputDir, outputDir, configuration, ...props } = JSON.parse(
    await fs.promises.readFile(instancePath, "utf8")
  );
  const factory = new Factory(configuration, inputDir, outputDir);
  factory.loadProps(props);
  return factory;
}
