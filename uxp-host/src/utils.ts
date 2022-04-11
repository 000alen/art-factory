import path from "path";
import axios from "axios";
import fs from "fs";
import imageSize from "image-size";
import { Configuration } from "./typings";
import sharp from "sharp";
import { restrictImage } from "./Factory";

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

export const capitalize = (string: string) =>
  string.charAt(0).toUpperCase() + string.slice(1);
