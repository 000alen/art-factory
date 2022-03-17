import fs from "fs";
import path from "path";
import Jimp from "jimp";
import imageSize from "image-size";

import { Configuration, Layer, Node, NodesAndEdges, Trait } from "./newTypings";
import { append, rarity, removeRarity } from "./utils";

const DEFAULT_BLENDING = "normal";
const DEFAULT_OPACITY = 1;

async function readDir(dir: string): Promise<string[]> {
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

export function getPaths(nodesAndEdges: NodesAndEdges): Node[][] {
  const root = nodesAndEdges.find((node) => node.type === "rootNode") as Node;

  const stack: {
    node: Node;
    path: Node[];
  }[] = [
    {
      node: root,
      path: [root],
    },
  ];

  const savedPaths = [];
  while (stack.length > 0) {
    const actualNode = stack.pop();
    // @ts-ignore
    const neighbors = getOutgoers(actualNode.node, nodesAndEdges);

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

export class Factory {
  layerByName: Map<string, Layer>;
  traitsByLayerName: Map<string, Trait[]>;
  traitsBuffer: Map<string, Buffer>;

  constructor(
    public configuration: Configuration,
    public inputDir: string,
    public outputDir: string
  ) {
    this.layerByName = new Map();
    this.traitsByLayerName = new Map();

    this._ensureOutputDir();
    this._ensureLayers();
  }

  private async _ensureOutputDir() {
    if (!fs.existsSync(this.outputDir)) fs.mkdirSync(this.outputDir);

    if (!fs.existsSync(path.join(this.outputDir, "json")))
      fs.mkdirSync(path.join(this.outputDir, "json"));

    if (!fs.existsSync(path.join(this.outputDir, "images")))
      fs.mkdirSync(path.join(this.outputDir, "images"));
  }

  private async _ensureLayers() {
    const layersPaths: string[] = await readDir(this.inputDir);

    const layers: Layer[] = layersPaths.map((layerPath) => ({
      basePath: path.join(this.inputDir, layerPath),
      name: layerPath,
      blending: DEFAULT_BLENDING,
      opacity: DEFAULT_OPACITY,
    }));

    const traitsPathsByLayerIndex: string[][] = await Promise.all(
      layersPaths.map((layerName) =>
        readDir(path.join(this.inputDir, layerName))
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
    if (this.traitsBuffer.has(key)) return;

    let buffer = await fs.promises.readFile(key);
    let { width, height } = imageSize(buffer);

    if (
      trait.type === "png" &&
      (width !== this.configuration.width ||
        height !== this.configuration.height)
    ) {
      const image = await Jimp.read(buffer);
      image.resize(this.configuration.width, this.configuration.height);
      buffer = await image.getBufferAsync(Jimp.MIME_PNG);
    }

    this.traitsBuffer.set(key, buffer);
  }

  generateTraits(
    layers: Layer[],
    n: number,
    cache: Map<string, Trait[]> = new Map()
  ) {
    let attributes: Trait[][] = Array.from({ length: n }, () => []);

    for (const layer of layers) {
      const { name } = layer;
      if (cache.has(name)) {
        attributes = append(attributes, cache.get(name).slice(0, n));
      } else {
        for (let i = 0; i < n; i++) {
          const traits = this.traitsByLayerName.get(name);
          const trait = choose(traits);
          attributes[i].push(trait);
        }
      }
    }

    return attributes;
  }

  generateCollection(nodesAndEdges: NodesAndEdges) {
    const paths = getPaths(nodesAndEdges)
      .map((path) => path.slice(1))
      .map((path) => path.map((node) => node.data));
  }

  generateImages() {}

  generateMetadata() {}

  deployImages() {}

  deployMetadata() {}

  getTraitImage() {}

  getImage() {}

  getMetadata() {}
}
