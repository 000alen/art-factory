const fs = require("fs");
const path = require("path");
const Jimp = require("jimp");
const { randomColor, rarityWeightedChoice, rarity } = require("./utils");
const dotenv = require("dotenv");
const { pinDirectoryToIPFS } = require("./utils");

dotenv.config();

// ! TODO: Support vectorized images
// TODO: Support 3D assets
class Factory {
  layers;
  buffers;

  imagesCID;
  metadataCID;
  contractAddress;

  constructor(configuration, inputDir, outputDir) {
    this.configuration = configuration;
    this.inputDir = inputDir;
    this.outputDir = outputDir;
    this.layers = new Map();
    this.buffers = new Map();
  }

  get maxCombinations() {
    return this.configuration.layers.reduce((accumulator, layer) => {
      return accumulator * this.layers.get(layer).length;
    }, 1);
  }

  get instance() {
    return {
      imagesCID: this.imagesCID,
      metadataCID: this.metadataCID,
      contractAddress: this.contractAddress,
    };
  }

  loadInstance({ imagesCID, metadataCID, contractAddress }) {
    this.imagesCID = imagesCID;
    this.metadataCID = metadataCID;
    this.contractAddress = contractAddress;
  }

  async loadLayers() {
    try {
      // Read the layers folders
      const layersNames = (await fs.promises.readdir(this.inputDir)).filter(
        (file) => !file.startsWith(".")
      );

      // Read the files from layers
      const layersElements = await Promise.all(
        layersNames.map(async (layerName) =>
          (
            await fs.promises.readdir(path.join(this.inputDir, layerName))
          ).filter((file) => !file.startsWith("."))
        )
      );

      // Put the layers on a map
      layersNames.forEach((layerName, i) => {
        this.layers.set(
          layerName,
          layersElements[i].map((layerElement) => ({
            name: layerElement,
            rarity: rarity(layerElement),
          }))
        );
      });
    } catch (error) {
      throw error;
    }
  }

  async bootstrapOutput() {
    if (fs.existsSync(this.outputDir))
      fs.rmSync(this.outputDir, { recursive: true });
    fs.mkdirSync(this.outputDir);
    fs.mkdirSync(path.join(this.outputDir, "json"));
    fs.mkdirSync(path.join(this.outputDir, "images"));
  }

  generateRandomAttributes(n) {
    if (n > this.maxCombinations)
      console.warn(
        `WARN: n > maxCombinations (${n} > ${this.maxCombinations})`
      );

    const attributes = [];

    for (let i = 0; i < n; i++) {
      const attribute = [];

      for (const layerName of this.configuration.layers) {
        const layerElements = this.layers.get(layerName);
        const name = rarityWeightedChoice(layerElements);

        attribute.push({
          name: layerName,
          value: name,
        });
      }

      attributes.push(attribute);
    }

    return attributes;
  }

  generateAllAttributes() {
    const attributes = [];

    function* generator(configuration, layers, n) {
      if (n === 0) {
        yield [];
        return;
      }

      const layerName = configuration.layers[configuration.layers.length - n];
      const layerElements = layers.get(layerName);

      for (const layerElement of layerElements) {
        for (const _ of generator(configuration, layers, n - 1)) {
          yield [{ name: layerName, value: layerElement.name }, ..._];
        }
      }
    }

    for (const attribute of generator(
      this.configuration,
      this.layers,
      this.configuration.layers.length
    )) {
      attributes.push(attribute);
    }

    return attributes;
  }

  composeImages(back, front) {
    back.composite(front, 0, 0);
    return back;
  }

  async ensureBuffer(elementKey) {
    if (!this.buffers.has(elementKey)) {
      const buffer = await fs.promises.readFile(
        path.join(this.inputDir, elementKey)
      );
      this.buffers.set(elementKey, buffer);
    }
  }

  // ! TODO: Careful with memory usage
  // ! TODO: Change the algorithm complexity from O(n) to O(log n)
  async generateImages(attributes) {
    await Promise.all(
      attributes.map(async (traits, i) => {
        const image = await Jimp.create(
          this.configuration.width,
          this.configuration.height,
          this.configuration.generateBackground
            ? randomColor()
            : this.configuration.defaultBackground || 0xffffff
        );

        for (const trait of traits) {
          const elementKey = path.join(trait.name, trait.value);
          await this.ensureBuffer(elementKey);
          const current = await Jimp.read(this.buffers.get(elementKey));
          this.composeImages(image, current);
        }

        await image.writeAsync(
          path.join(this.outputDir, "images", `${i + 1}.png`)
        );
      })
    );
  }

  getTraitValueByFilename(filename) {
    const trait_value = filename.split("#");

    if (trait_value.length != 2)
      throw new Error(`File ${filename} doesnt have the correct format`);

    return trait_value[0];
  }

  async generateMetadata(cid, attributes) {
    const metadatas = [];
    for (let i = 0; i < attributes.length; i++) {
      const traits = attributes[i];

      const metadata = {
        name: this.configuration.name,
        description: this.configuration.description,
        image: `ipfs://${cid}/${i + 1}.png`,
        edition: i,
        date: Date.now(),
        attributes: traits.map((trait) => ({
          trait_type: trait.name,
          value: this.getTraitValueByFilename(trait.value),
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
  }

  // ! TODO: Optimize; buffers might be loaded in this.buffers (use this.ensureBuffer)
  async deployImages(force = false) {
    if (this.imagesCID !== undefined && !force) {
      console.warn(
        `WARN: images have already been deployed to IPFS (cid: ${this.imagesCID})`
      );
      return this.imagesCID;
    }

    const imagesDir = path.join(this.outputDir, "images");
    const { IpfsHash } = await pinDirectoryToIPFS(
      process.env.PINATA_API_KEY,
      process.env.PINATA_SECRET_API_KEY,
      imagesDir
    );
    this.imagesCID = IpfsHash;

    return this.imagesCID;
  }

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
      process.env.PINATA_API_KEY,
      process.env.PINATA_SECRET_API_KEY,
      jsonDir
    );
    this.metadataCID = IpfsHash;

    return this.metadataCID;
  }
}

module.exports = { Factory };
