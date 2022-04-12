import path from "path";
import fs from "fs";
import imageSize from "image-size";
import { Trait } from "./typings";
import sharp from "sharp";
import FormData from "form-data";
import axios from "axios";
import { RARITY_DELIMITER } from "./constants";

export function rarity(elementName: string) {
  let rarity = Number(elementName.split(RARITY_DELIMITER).pop());
  if (isNaN(rarity)) rarity = 1;
  return rarity;
}

export function removeRarity(elementName: string) {
  return elementName.split(RARITY_DELIMITER).shift();
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

export async function readDir(dir: string): Promise<string[]> {
  return (await fs.promises.readdir(dir)).filter(
    (file) => !file.startsWith(".")
  );
}

export function choose(
  traits: Trait[],
  temperature = 50,
  randomFunction = Math.random,
  influence = 2
): Trait {
  const T = (temperature - 50) / 50;
  const n = traits.length;
  if (!n) return null;

  const total = traits.reduce(
    (previousTotal, element) => previousTotal + element.rarity,
    0
  );

  const average = total / n;

  const urgencies: Record<string, number> = {};
  const urgencySum = traits.reduce((previousSum, element) => {
    const { value, rarity } = element;
    let urgency = rarity + T * influence * (average - rarity);
    if (urgency < 0) urgency = 0;
    urgencies[value] = (urgencies[value] || 0) + urgency;
    return previousSum + urgency;
  }, 0);

  let currentUrgency = 0;
  const cumulatedUrgencies: Record<string, number> = {};
  Object.keys(urgencies).forEach((id) => {
    currentUrgency += urgencies[id];
    cumulatedUrgencies[id] = currentUrgency;
  });

  if (urgencySum <= 0) return null;

  const choice = randomFunction() * urgencySum;
  const values = Object.keys(cumulatedUrgencies);
  for (let i = 0; i < values.length; i++) {
    const value = values[i];
    const urgency = cumulatedUrgencies[value];
    if (choice <= urgency) {
      return traits.find((trait) => trait.value === value);
    }
  }
}

export function getBundle(
  bundlesByRenderId: Map<string, string[]>,
  renderId: string
) {
  for (const [bundle, renderIds] of bundlesByRenderId) {
    if (renderIds.includes(renderId)) {
      return bundle;
    }
  }
}

export async function pinDirectoryToIPFS(
  pinataApiKey: string,
  pinataSecretApiKey: string,
  src: string
): Promise<{
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}> {
  const url = "https://api.pinata.cloud/pinning/pinFileToIPFS";
  const base = path.parse(src).base;

  const data = new FormData();
  (await readDir(src)).forEach((file) => {
    data.append("file", fs.createReadStream(path.join(src, file)), {
      filepath: path.join(base, path.parse(file).base),
    });
  });

  return axios
    .post(url, data, {
      // @ts-ignore
      maxBodyLength: "Infinity",
      headers: {
        // @ts-ignore
        "Content-Type": `multipart/form-data; boundary=${data._boundary}`,
        pinata_api_key: pinataApiKey,
        pinata_secret_api_key: pinataSecretApiKey,
      },
    })
    .then((response) => response.data);
}

export async function pinFileToIPFS(
  pinataApiKey: string,
  pinataSecretApiKey: string,
  src: string
): Promise<{
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}> {
  const url = "https://api.pinata.cloud/pinning/pinFileToIPFS";

  const data = new FormData();
  data.append("file", fs.createReadStream(src));

  return axios
    .post(url, data, {
      // @ts-ignore
      maxBodyLength: "Infinity",
      headers: {
        // @ts-ignore
        "Content-Type": `multipart/form-data; boundary=${data._boundary}`,
        pinata_api_key: pinataApiKey,
        pinata_secret_api_key: pinataSecretApiKey,
      },
    })
    .then((response) => response.data);
}

export async function restrictImage(buffer: Buffer, maxSize?: number) {
  if (maxSize) {
    let { width, height } = imageSize(buffer);
    const ratio = Math.max(width, height) / maxSize;
    if (ratio > 1) {
      width = Math.floor(width / ratio);
      height = Math.floor(height / ratio);
      buffer = await sharp(buffer).resize(width, height).png().toBuffer();
    }
  }
  return buffer;
}
