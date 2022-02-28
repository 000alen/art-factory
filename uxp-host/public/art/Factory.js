const fs = require("fs");
const path = require("path");
const Jimp = require("jimp");
const {
  randomColor,
  rarityWeightedChoice,
  rarity,
  pinDirectoryToIPFS,
  removeRarity,
} = require("./utils");
const { getOutgoers } = require("react-flow-renderer");
const { tuple } = require("immutable-tuple");
const { v4: uuid } = require("uuid");
const imageSize = require("image-size");

function getPaths(elements) {
  const root = elements
    .filter((element) => element.type === "rootNode")
    .shift();

  const stack = [];
  stack.push({
    node: root,
    path: [root],
  });

  const savedPaths = [];
  while (stack.length > 0) {
    const actualNode = stack.pop();
    const neighbors = getOutgoers(actualNode.node, elements);

    // Leaf node
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

function getPrefixes(paths) {
  const prefixes = new Set();

  for (const path of paths) {
    const filteredPaths = paths.filter((_path) => _path[0] === path[0]);
    const subPaths = filteredPaths.map((_path) => _path.slice(1));

    if (subPaths.length > 1) {
      prefixes.add(tuple(path[0]));

      const subPrefixes = getPrefixes(subPaths);
      for (const subPrefix of subPrefixes) {
        prefixes.add(tuple(path[0], ...subPrefix));
      }
    }
  }

  return prefixes;
}

function reducePaths(paths) {
  const cache = new Map();

  while (true) {
    const id = uuid();
    const prefix = [...getPrefixes(paths)]
      .map((prefix) => [...prefix])
      .map((prefix) =>
        prefix.length === 1 ? (cache.has(prefix[0]) ? null : prefix) : prefix
      )
      .filter((prefix) => prefix !== null)
      .sort((a, b) => a.length - b.length)[0];

    if (prefix === undefined) break;

    cache.set(id, prefix);

    paths = paths.map((path) =>
      tuple(...path.slice(0, prefix.length)) === tuple(...prefix)
        ? [id, ...path.slice(prefix.length)]
        : path
    );
  }

  return [cache, paths];
}

/**
 *
 * @param {Map<string,(string|number)[]>} cache
 * @param {string[][]} paths
 * @returns
 */
function computeNs(cache, paths) {
  const ns = new Map();

  for (const [id, cachedPath] of cache) {
    let n = paths
      .filter((path) => path.find((p) => p === id))
      .map((path) => path[path.length - 1])
      .reduce((a, b) => Math.max(a, b), 0);

    n = Math.max(ns.has(id) ? ns.get(id) : 0, n);
    const stack = [id];
    while (stack.length > 0) {
      const current = stack.pop();
      if (!ns.has(current) || ns.get(current) < n) ns.set(current, n);
      for (const v of cache.get(current)) if (ns.has(v)) stack.push(v);
    }
  }

  return ns;
}

function expandPathIfNeeded(cache, layers, path) {
  const _path = [];

  for (const id of path) {
    if (!layers.includes(id) && !cache.has(id)) {
      _path.push(...expandPathIfNeeded(cache, layers, cache.get(id)));
    } else {
      _path.push(id);
    }
  }

  return _path;
}

class Factory {
  secrets;
  layers;
  layerElementsBuffers;
  layerElementsPaths;

  attributes;
  generated;
  metadataGenerated;
  imagesCID;
  metadataCID;
  network;
  contractAddress;
  abi;

  constructor(configuration, inputDir, outputDir) {
    this.configuration = configuration;
    this.inputDir = inputDir;
    this.outputDir = outputDir;

    this.layers = new Map();
    this.layerElementsBuffers = new Map();
    this.layerElementsPaths = new Map();
  }

  get maxCombinations() {
    return this.configuration.layers.reduce((accumulator, layer) => {
      return accumulator * this.layers.get(layer).length;
    }, 1);
  }

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
    };
  }

  setProps(props) {
    const {
      attributes,
      generated,
      metadataGenerated,
      imagesCID,
      metadataCID,
      network,
      contractAddress,
      abi,
    } = props;
    if (attributes) this.attributes = attributes;
    if (generated) this.generated = generated;
    if (metadataGenerated) this.metadataGenerated = metadataGenerated;
    if (imagesCID) this.imagesCID = imagesCID;
    if (metadataCID) this.metadataCID = metadataCID;
    if (network) this.network = network;
    if (contractAddress) this.contractAddress = contractAddress;
    if (abi) this.abi = abi;
  }

  loadSecrets({ pinataApiKey, pinataSecretApiKey }) {
    this.secrets = {
      ...this.secrets,
      pinataApiKey,
      pinataSecretApiKey,
    };
  }

  async saveInstance() {
    await this.ensureOutputDir();
    const instancePath = path.join(this.outputDir, "instance.json");
    await fs.promises.writeFile(instancePath, JSON.stringify(this.instance));
    return instancePath;
  }

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
        const _ = path.parse(layerElementPath).name;
        return {
          name: removeRarity(_),
          rarity: rarity(_),
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

  async ensureLayerElementsBuffer(layerElementPath) {
    if (!this.layerElementsBuffers.has(layerElementPath)) {
      this.layerElementsBuffers.set(
        layerElementPath,
        await fs.promises.readFile(path.join(this.inputDir, layerElementPath))
      );
    }
  }

  generateRandomAttributes(n) {
    if (n > this.maxCombinations)
      console.warn(
        `WARN: n > maxCombinations (${n} > ${this.maxCombinations})`
      );

    this.configuration.n = n;

    const attributes = [];

    for (let i = 0; i < n; i++) {
      const attribute = [];

      for (const layerName of this.configuration.layers) {
        const layerElements = this.layers.get(layerName);
        const { name, rarity } = rarityWeightedChoice(layerElements);

        attribute.push({
          name: layerName,
          value: name,
          rarity,
        });
      }

      attributes.push(attribute);
    }

    this.attributes = attributes;

    return attributes;
  }

  generateAttributes() {
    this.configuration.n = this.maxCombinations;

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
          yield [
            {
              name: layerName,
              value: layerElement.name,
              rarity: layerElement.rarity,
            },
            ..._,
          ];
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

    this.attributes = attributes;

    return attributes;
  }

  generateRandomAttributesFromLayers(layers, n) {
    if (n > this.maxCombinations)
      console.warn(
        `WARN: n > maxCombinations (${n} > ${this.maxCombinations})`
      );
    const attributes = [];

    for (let i = 0; i < n; i++) {
      const attribute = [];

      for (const layerName of layers) {
        const layerElements = this.layers.get(layerName);

        const { name, rarity } = rarityWeightedChoice(layerElements); // RANDOM

        attribute.push({
          name: layerName,
          value: name,
          rarity,
        });
      }

      attributes.push(attribute);
    }

    return attributes;
  }

  append(a, b) {
    return a.map((a_i, i) => [...a_i, ...b[i]]);
  }

  generateAttributesFromLayers(layers, n, attributesCache) {
    if (n > this.maxCombinations)
      console.warn(
        `WARN: n > maxCombinations (${n} > ${this.maxCombinations})`
      );

    let attributes = [...Array(n).keys()].map(() => []);

    for (const layerName of layers) {
      if (attributesCache && attributesCache.has(layerName)) {
        attributes = this.append(
          attributes,
          attributesCache.get(layerName).slice(0, n)
        );
      } else {
        for (let i = 0; i < n; i++) {
          const layerElements = this.layers.get(layerName);
          const { name, rarity } = rarityWeightedChoice(layerElements);
          attributes[i].push({
            name: layerName,
            value: name,
            rarity,
          });
        }
      }
    }

    return attributes;
  }

  generateRandomAttributesFromNodes(layersNodes) {
    const paths = getPaths(layersNodes)
      .map((p) => p.slice(1))
      .map((p) =>
        p.map(({ type: t, data: d }) => (t === "layerNode" ? d.layer : d.n))
      )
      .sort((a, b) => a.length - b.length);

    const [cache, reducedPaths] = reducePaths(paths);
    const ns = computeNs(cache, reducedPaths);
    const attributesCache = new Map();

    for (const [id, value] of cache)
      attributesCache.set(
        id,
        this.generateAttributesFromLayers(
          expandPathIfNeeded(cache, this.configuration.layers, value),
          ns.get(id),
          attributesCache
        )
      );

    const attributes = [];

    for (const path of reducedPaths) {
      const n = path.pop();

      const _attributes = this.generateAttributesFromLayers(
        path,
        n,
        attributesCache
      );

      attributes.push(..._attributes);
    }

    return attributes;
  }
  composeImages(back, front) {
    back.composite(front, 0, 0);
    return back;
  }

  // ! TODO: Careful with memory usage
  // ! TODO: Change the algorithm complexity from O(n) to O(log n)
  // ! TODO: Reescale images to a fixed size
  async generateImages(attributes, callback) {
    await Promise.all(
      attributes.map(async (traits, i) => {
        const image = await Jimp.create(
          this.configuration.width,
          this.configuration.height,
          this.configuration.generateBackground
            ? randomColor()
            : this.configuration.defaultBackground || "#ffffff"
        );

        for (const trait of traits) {
          const layerElementPath = this.layerElementsPaths.get(
            path.join(trait.name, trait.value)
          );
          await this.ensureLayerElementsBuffer(layerElementPath);
          const current = await Jimp.read(
            this.layerElementsBuffers.get(layerElementPath)
          );
          this.composeImages(image, current);
        }

        await image.writeAsync(
          path.join(this.outputDir, "images", `${i + 1}.png`)
        );

        if (callback !== undefined) callback(i + 1);
      })
    );
    this.generated = true;
  }

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

  getRandomImage(attributes) {
    const index = Math.floor(Math.random() * attributes.length);
    return fs.readFileSync(
      path.join(this.outputDir, "images", `${index + 1}.png`)
    );
  }

  getImage(index) {
    return fs.readFileSync(
      path.join(this.outputDir, "images", `${index + 1}.png`)
    );
  }

  async getRandomTraitImage(layerName) {
    const layerElements = this.layers.get(layerName);
    const { name } = rarityWeightedChoice(layerElements);
    const layerElementPath = this.layerElementsPaths.get(
      path.join(layerName, name)
    );
    await this.ensureLayerElementsBuffer(layerElementPath);
    return this.layerElementsBuffers.get(layerElementPath);
  }

  async getTraitImage(trait) {
    const layerElementPath = this.layerElementsPaths.get(
      path.join(trait.name, trait.value)
    );
    await this.ensureLayerElementsBuffer(layerElementPath);
    return this.layerElementsBuffers.get(layerElementPath);
  }

  async rewriteImage(i, dataUrl) {
    await fs.promises.writeFile(
      path.join(this.outputDir, "images", `${i + 1}.png`),
      Buffer.from(dataUrl.replace(/^data:image\/png;base64,/, ""), "base64")
    );
  }
}

async function loadInstance(instancePath) {
  const { inputDir, outputDir, configuration, ...props } = JSON.parse(
    await fs.promises.readFile(instancePath, "utf8")
  );
  const factory = new Factory(configuration, inputDir, outputDir);
  factory.setProps(props);
  return factory;
}

function layersNames(inputDir) {
  let allLayers = fs
    .readdirSync(inputDir)
    .filter((file) => !file.startsWith("."));

  const pattern = /(\d+)\..+/g;
  let correctMatch = 0;

  for (const layer of allLayers) {
    if (layer.match(pattern)) correctMatch++;
  }

  if (correctMatch != allLayers.length) {
    // Just return the folders
    return allLayers;
  }

  allLayers.sort((a, b) => {
    const numberA = Number(a.split(".")[0]);
    const numberB = Number(b.split(".")[0]);

    return numberA - numberB;
  });

  return allLayers;
}

function name(inputDir) {
  return path.basename(inputDir);
}

function sizeOf(inputDir) {
  const layer = fs
    .readdirSync(inputDir)
    .filter((file) => !file.startsWith("."))[0];
  const layerElement = fs
    .readdirSync(path.join(inputDir, layer))
    .filter((file) => !file.startsWith("."))[0];

  const { width, height } = imageSize(path.join(inputDir, layer, layerElement));
  return { width, height };
}

async function compose(...buffers) {
  const image = await Jimp.read(buffers[0]);

  for (let i = 1; i < buffers.length; i++) {
    const current = await Jimp.read(buffers[i]);
    image.composite(current, 0, 0);
  }

  return new Promise((resolve, reject) => {
    image.getBuffer(Jimp.MIME_PNG, (error, buffer) => {
      if (error) reject(error);
      resolve(buffer);
    });
  });
}

module.exports = { Factory, loadInstance, layersNames, name, sizeOf, compose };
