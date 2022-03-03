const Jimp = require("jimp");
const path = require("path");
const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");
const { getOutgoers } = require("react-flow-renderer");
const { tuple } = require("immutable-tuple");
const { v4: uuid } = require("uuid");
const imageSize = require("image-size");
const { Factory } = require("./Factory");

const RARITY_DELIMITER = "#";

function randomColor() {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  const a = 255;

  return Jimp.rgbaToInt(r, g, b, a);
}

function rarity(elementName) {
  let rarity = Number(elementName.split(RARITY_DELIMITER).pop());
  if (isNaN(rarity)) rarity = 1;
  return rarity;
}

function removeRarity(elementName) {
  return elementName.split(RARITY_DELIMITER).shift();
}

// Source: https://github.com/parmentf/random-weighted-choice
function rarityWeightedChoice(
  layerElements,
  temperature = 50,
  randomFunction = Math.random,
  influence = 2
) {
  const T = (temperature - 50) / 50;
  const nb = layerElements.length;
  if (!nb) return null;

  const total = layerElements.reduce(
    (previousTotal, element) => previousTotal + element.rarity,
    0
  );

  const avg = total / nb;

  const ur = {};
  const urgencySum = layerElements.reduce((previousSum, element) => {
    const { name, rarity } = element;
    let urgency = rarity + T * influence * (avg - rarity);
    if (urgency < 0) urgency = 0;
    ur[name] = (ur[name] || 0) + urgency;
    return previousSum + urgency;
  }, 0);

  let currentUrgency = 0;
  const cumulatedUrgencies = {};
  Object.keys(ur).forEach((id) => {
    currentUrgency += ur[id];
    cumulatedUrgencies[id] = currentUrgency;
  });

  if (urgencySum <= 0) return null;

  const choice = randomFunction() * urgencySum;
  const names = Object.keys(cumulatedUrgencies);
  const rarities = layerElements.map((element) => element.rarity);
  const types = layerElements.map((element) => element.type);
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    const urgency = cumulatedUrgencies[name];
    if (choice <= urgency) {
      return { name, rarity: rarities[i], type: types[i] };
    }
  }
}

// Source: https://docs.pinata.cloud/api-pinning/pin-file
// {
//   IpfsHash: This is the IPFS multi-hash provided back for your content,
//   PinSize: This is how large (in bytes) the content you just pinned is,
//   Timestamp: This is the timestamp for your content pinning (represented in ISO 8601 format)
// }
async function pinDirectoryToIPFS(pinataApiKey, pinataSecretApiKey, src) {
  const url = "https://api.pinata.cloud/pinning/pinFileToIPFS";
  const base = path.parse(src).base;

  const data = new FormData();
  (await fs.promises.readdir(src))
    .filter((file) => !file.startsWith("."))
    .forEach((file) => {
      data.append("file", fs.createReadStream(path.join(src, file)), {
        filepath: path.join(base, path.parse(file).base),
      });
    });

  return axios
    .post(url, data, {
      maxBodyLength: "Infinity",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${data._boundary}`,
        pinata_api_key: pinataApiKey,
        pinata_secret_api_key: pinataSecretApiKey,
      },
    })
    .then((response) => response.data);
  // .catch((error) => console.error(error));
}

function pinFileToIPFS(pinataApiKey, pinataSecretApiKey, src) {
  const url = "https://api.pinata.cloud/pinning/pinFileToIPFS";

  const data = new FormData();
  data.append("file", fs.createReadStream(src));

  return axios
    .post(url, data, {
      maxBodyLength: "Infinity",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${data._boundary}`,
        pinata_api_key: pinataApiKey,
        pinata_secret_api_key: pinataSecretApiKey,
      },
    })
    .then((response) => response.data);
  // .catch((error) => console.error(error));
}

// ! TODO
// Source: https://docs.etherscan.io/tutorials/verifying-contracts-programmatically
function verifyContract(
  apiKey,
  sourceCode,
  network,
  contractaddress,
  codeformat,
  contractname,
  compilerversion,
  optimizationUsed
) {
  const urls = {
    mainnet: "https://api.etherscan.io/api",
    ropsten: "https://api-ropsten.etherscan.io/api",
    rinkeby: "https://api-rinkeby.etherscan.io/api",
  };
  const url = urls[network];

  return axios
    .post(url, {
      module: "contract",
      action: "verify",
      contractaddress,
      sourceCode,
      codeformat,
      contractname,
      compilerversion,
      optimizationUsed,
      apikey: apiKey,
    })
    .then((response) => response.data);
}

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

function append(a, b) {
  return a.map((a_i, i) => [...a_i, ...b[i]]);
}

function composeImages(back, front, width, height) {
  front.resize(width, height);
  back.composite(front, 0, 0);
  return back;
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

async function compose(buffers, configuration) {
  const height = configuration.height;
  const width = configuration.width;

  const image = await Jimp.read(buffers[0]);

  image.resize(width, height);

  for (let i = 1; i < buffers.length; i++) {
    const current = await Jimp.read(buffers[i]);
    current.resize(width, height);
    image.composite(current, 0, 0);
  }

  return new Promise((resolve, reject) => {
    image.getBuffer(Jimp.MIME_PNG, (error, buffer) => {
      if (error) reject(error);
      resolve(buffer);
    });
  });
}

module.exports = {
  RARITY_DELIMITER,
  randomColor,
  rarity,
  removeRarity,
  rarityWeightedChoice,
  pinDirectoryToIPFS,
  pinFileToIPFS,
  verifyContract,
  getPaths,
  getPrefixes,
  reducePaths,
  computeNs,
  expandPathIfNeeded,
  append,
  composeImages,
  layersNames,
  name,
  sizeOf,
  compose,
};
