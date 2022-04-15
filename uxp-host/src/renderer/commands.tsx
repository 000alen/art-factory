import { v4 as uuid } from "uuid";
import { LayerNodeComponentData } from "./components/LayerNode";
import {
  ensureProjectStructure,
  factoryMakeGeneration,
  factoryGenerateImages,
  factoryGenerateMetadata,
  factoryRemove,
  factoryUnify,
  readProjectInstance,
  showOpenDialog,
  writeProjectInstance,
} from "./ipc";
import { getBranches } from "./nodesUtils";
import {
  Bundles,
  BundlesInfo,
  Collection,
  Generation,
  Instance,
  MetadataItem,
  Template,
  Trait,
} from "./typings";
import { createInstance, hash } from "./utils";
import { Node as FlowNode } from "react-flow-renderer";

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
): Promise<{ collection: Collection; bundles: Bundles }> => {
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
): Promise<{ collection: Collection; bundles: Bundles }> => {
  const { collection, bundles } = await factoryUnify(id, name, generations);
  return { collection, bundles };
};

export const removeGeneration = async (id: string, generation: Generation) => {
  await factoryRemove(id, generation);
};
