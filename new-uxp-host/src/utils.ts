import Jimp from "jimp";
import path from "path";
import axios from "axios";
import fs from "fs";
import imageSize from "image-size";
import { Configuration } from "./typings";

export const RARITY_DELIMITER = "#";

export function rarity(elementName: string) {
  let rarity = Number(elementName.split(RARITY_DELIMITER).pop());
  if (isNaN(rarity)) rarity = 1;
  return rarity;
}

export function removeRarity(elementName: string) {
  return elementName.split(RARITY_DELIMITER).shift();
}

// ! TODO
// Source: https://docs.etherscan.io/tutorials/verifying-contracts-programmatically
export function verifyContract(
  apiKey: string,
  sourceCode: string,
  network: string,
  contractaddress: string,
  codeformat: string,
  contractname: string,
  compilerversion: string,
  optimizationUsed: number
) {
  const urls = {
    mainnet: "https://api.etherscan.io/api",
    ropsten: "https://api-ropsten.etherscan.io/api",
    rinkeby: "https://api-rinkeby.etherscan.io/api",
  };
  // @ts-ignore
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

export function append(a: any[], b: any[]) {
  return a.map((a_i, i) => [...a_i, ...b[i]]);
}

export function layersNames(inputDir: string) {
  return fs.readdirSync(inputDir).filter((file) => !file.startsWith("."));
}

export function name(inputDir: string) {
  return path.basename(inputDir);
}

export function sizeOf(inputDir: string) {
  const layer = fs
    .readdirSync(inputDir)
    .filter((file) => !file.startsWith("."))[0];
  const layerElement = fs
    .readdirSync(path.join(inputDir, layer))
    .filter((file) => !file.startsWith("."))[0];

  const { width, height } = imageSize(path.join(inputDir, layer, layerElement));
  return { width, height };
}

export async function compose(buffers: Buffer[], configuration: Configuration) {
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
