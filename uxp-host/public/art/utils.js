const Jimp = require("jimp");
const path = require("path");
const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");

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
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    const urgency = cumulatedUrgencies[name];
    if (choice <= urgency) {
      return { name, rarity: rarities[i] };
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

module.exports = {
  RARITY_DELIMITER,
  randomColor,
  rarity,
  removeRarity,
  rarityWeightedChoice,
  pinDirectoryToIPFS,
  pinFileToIPFS,
};
