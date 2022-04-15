import { v4 as uuid } from "uuid";
import { LayerNodeComponentData } from "./components/LayerNode";
import {
  ensureProjectStructure,
  factoryGenerateCollection,
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

export const generateFromTemplate = async (
  id: string,
  name: string,
  metadataItems: MetadataItem[],
  template: Template,
  onProgress?: (name: string) => void
): Promise<{ collection: Collection; bundles: Bundles }> => {
  const { nodes, edges, ns, ignored } = template;

  const nData = (
    getBranches(nodes, edges).map((branch) =>
      branch.slice(1, -1)
    ) as FlowNode<LayerNodeComponentData>[][]
  ).map((branch) => branch.map((node) => node.data));
  let keys = nData
    .map((branch) =>
      branch.map((data) => ({
        ...data.trait,
        id: data.id,
      }))
    )
    .map(hash);

  const nTraits: Trait[][] = nData
    .map((branch) =>
      branch.map((data) => ({
        ...data.trait,
        id: data.id,
        opacity: data.opacity,
        blending: data.blending,
      }))
    )
    .filter((_, i) => !ignored.includes(keys[i]));

  keys = keys.filter((key) => !ignored.includes(key));

  const bundlesInfo: BundlesInfo = nodes
    .filter((node) => node.type === "bundleNode")
    .map((node) => node.data)
    .map((data) => ({
      name: data.name,
      ids: data.ids,
    }));

  const { collection, bundles } = await factoryGenerateCollection(
    id,
    keys,
    nTraits,
    ns,
    bundlesInfo
  );
  await factoryGenerateImages(id, name, collection, onProgress);
  await factoryGenerateMetadata(id, name, collection, metadataItems);

  return { collection, bundles };
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
