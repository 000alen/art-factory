import { Node as FlowNode } from "react-flow-renderer";
import { v4 as uuid } from "uuid";

import { LayerNodeComponentData } from "./components/LayerNode";
import { MAX_SIZE } from "./constants";
import {
  ensureProjectStructure,
  factoryComposeTraits,
  factoryGenerateImages,
  factoryGenerateMetadata,
  factoryGetImage,
  factoryMakeGeneration,
  factoryRegenerateItems,
  factoryRemove,
  factoryReplaceItems,
  factoryUnify,
  readProjectInstance,
  showOpenDialog,
  writeProjectInstance,
} from "./ipc";
import {
  Collection,
  Generation,
  Instance,
  MetadataItem,
  Template,
  Trait,
} from "./typings";
import { createInstance, getBranches, hash } from "./utils";

export interface LoadedInstance {
  projectDir: string;
  instance: Instance;
  id: string;
}

export const newProject = async (): Promise<LoadedInstance | undefined> => {
  const { canceled, filePaths } = await showOpenDialog({
    properties: ["openFile", "openDirectory"],
  });

  if (canceled) return;

  const [projectDir] = filePaths;
  const instance = createInstance();
  const id = uuid();

  await ensureProjectStructure(projectDir);
  await writeProjectInstance(projectDir, instance);

  return { projectDir, instance, id };
};

export const openProject = async (): Promise<LoadedInstance | undefined> => {
  const { canceled, filePaths } = await showOpenDialog({
    properties: ["openFile", "openDirectory"],
  });

  if (canceled) return;

  const [projectDir] = filePaths;
  const instance = await readProjectInstance(projectDir);
  const id = uuid();

  return { projectDir, instance, id };
};

export const generate = async (
  id: string,
  name: string,
  metadataItems: MetadataItem[],
  template: Template,
  onProgress?: (name: string) => void
): Promise<Generation> => {
  const generation = await factoryMakeGeneration(id, name, template);
  await factoryGenerateImages(id, generation, onProgress);
  await factoryGenerateMetadata(id, generation, metadataItems);
  return generation;
};

export const unifyGenerations = async (
  id: string,
  name: string,
  generations: Generation[],
  onProgress?: (name: string) => void
): Promise<Generation> => {
  const generation = await factoryUnify(id, name, generations);
  return generation;
};

export const removeGeneration = async (id: string, generation: Generation) => {
  await factoryRemove(id, generation);
};

export const getTemplatePreview = async (id: string, template: Template) => {
  const { nodes, edges } = template;

  const nData = (
    getBranches(nodes, edges).map((branch) =>
      branch.slice(1, -1)
    ) as FlowNode<LayerNodeComponentData>[][]
  ).map((branch) => branch.map((node) => node.data));
  const nTraits: Trait[][] = nData.map((branch) =>
    branch.map((data) => ({
      ...data.trait,
      id: data.id,
      opacity: data.opacity,
      blending: data.blending,
    }))
  );
  const traits = nTraits.shift();
  return traits
    ? `data:image/png;base64,${await factoryComposeTraits(
        id,
        traits,
        MAX_SIZE
      )}`
    : null;
};

export const getGenerationPreview = async (
  id: string,
  generation: Generation
) => {
  return generation.collection.length > 0
    ? `data:image/png;base64,${await factoryGetImage(
        id,
        generation,
        generation.collection[0]
      )}`
    : null;
};

export const computeTemplateN = async (template: Template) => {
  const { nodes, edges, ns, ignored } = template;

  const nData = (
    getBranches(nodes, edges).map((branch) =>
      branch.slice(1, -1)
    ) as FlowNode<LayerNodeComponentData>[][]
  ).map((branch) => branch.map((node) => node.data));

  const n = nData
    .map((branch) =>
      branch.map((data) => ({
        ...data.trait,
        id: data.id,
      }))
    )
    .map(hash)
    .filter((key) => !ignored.includes(key))
    .reduce((acc, key) => ns[key] + acc, 0);

  return n;
};

export const regenerateItems = async (
  id: string,
  generation: Generation,
  items: Collection
) => {
  const _generation = await factoryRegenerateItems(id, generation, items);
  return _generation;
};

export const replaceItems = async (
  id: string,
  generation: Generation,
  _with: Collection
) => {
  const _generation = await factoryReplaceItems(id, generation, _with);
  return _generation;
};

export const computeGenerationRepeats = (generation: Generation) => {
  const { collection } = generation;
  const keys = new Set<string>();
  const repeats: Collection = [];
  for (const item of collection) {
    const key = hash(item.traits);
    if (keys.has(key)) repeats.push({ ...item });
    else keys.add(key);
  }
  return repeats;
};
