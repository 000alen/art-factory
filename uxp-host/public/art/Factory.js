// @ts-check
/** @typedef { {pinataApiKey: string, pinataSecretApiKey: string, infuraId: string, etherscanApiKey: string} } Secrets */
/** @typedef {{n: number, layers: string[], width: number, height: number, generateBackground: boolean, defaultBackground: string, name: string, description: string, symbol: string}} Configuration */
/** @typedef {{ name: string, rarity: number, type: string, blending: string, opacity: number }} Layer */
/** @typedef { Layer & { value: string } } Trait */
/** @typedef {Trait[][]} Attributes */
/** @typedef {{ inputDir: string, outputDir: string, configuration: Configuration, attributes: Attributes, generated: boolean, metadataGenerated: boolean, imagesCID: string, metadataCID: string, network: string, contractAddress: string, abi: any[], compilerVersion: string }} Instance */

const fs = require("fs");
const path = require("path");
const Jimp = require("jimp");
const {
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
  layersNames,
  name,
  sizeOf,
  compose,
} = require("./utils");
const imageSize = require("image-size");

const DEFAULT_BACKGROUND = "#ffffff";

class Factory {
  /** @type {Secrets} */ secrets;
  /** @type {Map<string, Layer[]>} */ layers;
  /** @type {Map<string, Buffer>} */ layerElementsBuffers;
  /** @type {Map<string, string>} */ layerElementsPaths;
  /** @type {Attributes} */ attributes;
  /** @type {boolean} */ generated;
  /** @type {boolean} */ metadataGenerated;
  /** @type {string} */ imagesCID;
  /** @type {string} */ metadataCID;
  /** @type {string} */ network;
  /** @type {string} */ contractAddress;
  /** @type {any[]} */ abi;

  /**
   * @param {Configuration} configuration
   * @param {string} inputDir
   * @param {string} outputDir
   */
  constructor(configuration, inputDir, outputDir) {
    this.configuration = configuration;
    this.inputDir = inputDir;
    this.outputDir = outputDir;

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
  /** @returns {number} */
  get maxCombinations() {
    return this.configuration.layers.reduce((accumulator, layer) => {
      return accumulator * this.layers.get(layer).length;
    }, 1);
  }

  /** @returns {Instance} */
  get instance() {
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
  /** @param {Partial<Instance>} props */
  loadProps(props) {
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
  /** @param {Partial<Secrets>} partialSecrets */
  loadSecrets({ pinataApiKey, pinataSecretApiKey, infuraId, etherscanApiKey }) {
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
          opacity: 1,         // Default opacity
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

  /** @param {string} layerElementPath */
  async ensureLayerElementBuffer(layerElementPath) {
    if (!this.layerElementsBuffers.has(layerElementPath)) {
      this.layerElementsBuffers.set(
        layerElementPath,
        await fs.promises.readFile(path.join(this.inputDir, layerElementPath))
      );
    }
  }
  // #endregion

  // #region Attributes Generation
  /**
   * @param {string[]} layers
   * @param {number} n
   * @param {Map<string, Attributes>} attributesCache
   * @returns {Attributes}
   */
  generateRandomAttributesFromLayers(layers, n, attributesCache) {
    if (n > this.maxCombinations)
      console.warn(
        `WARN: n > maxCombinations (${n} > ${this.maxCombinations})`
      );

    let attributes = [...Array(n).keys()].map(() => []);

    for (const layerName of layers) {
      if (attributesCache && attributesCache.has(layerName)) {
        attributes = append(
          attributes,
          attributesCache.get(layerName).slice(0, n)
        );
      } else {
        for (let i = 0; i < n; i++) {
          const layerElements = this.layers.get(layerName);
          const { name, rarity, type, blending, opacity } =
            rarityWeightedChoice(layerElements);
          attributes[i].push({
            name: layerName,
            value: name,
            rarity,
            type,
            blending,
            opacity,
          });
        }
      }
    }

    return attributes;
  }

  /**
   * @param {any[]} layersNodes
   * @returns {Attributes}
   */
  generateRandomAttributesFromNodes(layersNodes) {
    const paths = getPaths(layersNodes)
      .map((p) => p.slice(1))
      .map((p) =>
        p.map(({ type: t, data: d }) => (t === "layerNode" ? d.layer : d.n))
      )
      .sort((a, b) => a.length - b.length);

    this.configuration.n = layersNodes.reduce(
      (p, c) => p + (c.type === "renderNode" ? c.data.n : 0),
      0
    );

    const [cache, reducedPaths] = reducePaths(paths);
    const ns = computeNs(cache, reducedPaths);
    const attributesCache = new Map();

    for (const [id, value] of cache)
      attributesCache.set(
        id,
        this.generateRandomAttributesFromLayers(
          expandPathIfNeeded(cache, this.configuration.layers, value),
          ns.get(id),
          attributesCache
        )
      );

    const attributes = [];

    for (const path of reducedPaths) {
      const n = path.pop();

      const _attributes = this.generateRandomAttributesFromLayers(
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
  /**
   * @param {Trait[]} traits
   * @param {number} i
   */
  async generateImage(traits, i) {
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
      composeImages(
        image,
        current,
        this.configuration.width,
        this.configuration.height
      );
    }

    await image.writeAsync(path.join(this.outputDir, "images", `${i + 1}.png`));
  }

  // ! TODO: Careful with memory usage (algorithm complexity: O(n) to O(log n))
  /**
   * @param {Attributes} attributes
   * @param {(i: number) => void} callback
   */
  async generateImages(attributes, callback) {
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
  /**
   * @param {string} cid
   * @param {Attributes} attributes
   */
  async generateMetadata(cid, attributes) {
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
  /**
   * @param {Trait} trait
   * @param {number} maxSize
   * @returns {Promise<Buffer>}
   */
  async getTraitImage(trait, maxSize) {
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

  /**
   * @param {string} layerName
   * @param {number} maxSize
   * @returns {Promise<Buffer>}
   */
  async getRandomTraitImage(layerName, maxSize) {
    const layerElements = this.layers.get(layerName);
    const { name: value,
      rarity,
      type,
      blending,
      opacity,
    } = rarityWeightedChoice(layerElements);
    return await this.getTraitImage({
      name: layerName, value,
      rarity,
      type,
      blending,
      opacity,
    }, maxSize);
  }
  // #endregion

  // #region Images
  /**
   * @param {Attributes} attributes
   * @param {number} maxSize
   * @returns {Promise<Buffer>}
   */
  async getRandomImage(attributes, maxSize) {
    const index = Math.floor(Math.random() * attributes.length);
    return await this.getImage(index, maxSize);
  }

  /**
   * @param {number} index
   * @param {number} maxSize
   * @returns {Promise<Buffer>}
   */
  async getImage(index, maxSize) {
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
  async rewriteImage(i, dataUrl) {
    await fs.promises.writeFile(
      path.join(this.outputDir, "images", `${i + 1}.png`),
      Buffer.from(dataUrl.replace(/^data:image\/png;base64,/, ""), "base64")
    );
  }
  // #endregion
}

// ? For some reason, this function must remain inside this file,
// ? otherwise it doesn't work ("Factory is not a constructor").
async function loadInstance(instancePath) {
  const { inputDir, outputDir, configuration, ...props } = JSON.parse(
    await fs.promises.readFile(instancePath, "utf8")
  );
  const factory = new Factory(configuration, inputDir, outputDir);
  factory.loadProps(props);
  return factory;
}

module.exports = { Factory, loadInstance };
