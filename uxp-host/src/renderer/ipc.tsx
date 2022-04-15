// #region Declarations
declare global {
  interface Window {
    ipcRenderer: {
      send: (channel: string, ...args: any[]) => void;
      on: (channel: string, listener: (...args: any[]) => void) => void;
      once: (channel: string, listener: (...args: any[]) => void) => void;
      removeListener: (
        channel: string,
        listener: (...args: any[]) => void
      ) => void;
    };
  }
}
// #endregion

import { v4 as uuid } from "uuid";
import {
  Bundles,
  BundlesInfo,
  Collection,
  CollectionItem,
  Configuration,
  Generation,
  Instance,
  Layer,
  MetadataItem,
  Secrets,
  Trait,
} from "./typings";
import { capitalize } from "./utils";

// #region Helpers
const ipcTask =
  (task: string) =>
  (...args: any[]) =>
    new Promise((resolve, reject) => {
      window.ipcRenderer.once(`${task}Result`, ({ error, result }) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
      window.ipcRenderer.send(task, ...args);
    });

const ipcTaskWithProgress =
  (task: string) =>
  (
    onProgress: ((...args: any[]) => void) | undefined,
    id: string,
    ...args: any[]
  ) =>
    new Promise((resolve, reject) => {
      const _onProgress = ({ id: _id, args }: { id: string; args: any[] }) => {
        if (_id === id && onProgress) onProgress(...args);
      };

      const _onResult = ({ error, result }: { error: any; result: any }) => {
        window.ipcRenderer.removeListener(`${task}Progress`, _onProgress);
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      };

      window.ipcRenderer.on(`${task}Progress`, _onProgress);
      window.ipcRenderer.once(`${task}Result`, _onResult);
      window.ipcRenderer.send(task, id, ...args);
    });

const ipcTaskWithRequestId =
  (task: string) =>
  (...args: any[]) => {
    const requestId = uuid();
    return new Promise((resolve, reject) => {
      const _onResult = ({
        requestId: _requestId,
        error,
        result,
      }: {
        requestId: string;
        error: any;
        result: any;
      }) => {
        if (_requestId === requestId) {
          window.ipcRenderer.removeListener(`${task}Result`, _onResult);

          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      };

      window.ipcRenderer.on(`${task}Result`, _onResult);
      window.ipcRenderer.send(task, requestId, ...args);
    });
  };

const ipcSetterAndGetter = <T,>(
  property: string
): [(value: T) => void, () => Promise<T>] => [
  (value: any) => ipcTask(`set${capitalize(property)}`)(value),
  () => ipcTask(`get${capitalize(property)}`)() as Promise<T>,
];

// #endregion

// #region General
export const readProjectInstance = (projectDir: string) =>
  ipcTask("readProjectInstance")(projectDir) as Promise<Instance>;

export const ensureProjectStructure = (projectDir: string) =>
  ipcTask("ensureProjectStructure")(projectDir);

export const writeProjectInstance = (projectDir: string, instance: Instance) =>
  ipcTask("writeProjectInstance")(projectDir, instance);

export const readProjectAvailableLayers = (projectDir: string) =>
  ipcTask("readProjectAvailableLayers")(projectDir) as Promise<string[]>;

export const hasFactory = (id: string) =>
  ipcTask("hasFactory")(id) as Promise<boolean>;

export const [setPinataApiKey, getPinataApiKey] =
  ipcSetterAndGetter<string>("pinataApiKey");

export const [setPinataSecretApiKey, getPinataSecretApiKey] =
  ipcSetterAndGetter<string>("pinataSecretApiKey");

export const [setInfuraProjectId, getInfuraProjectId] =
  ipcSetterAndGetter<string>("infuraProjectId");

export const [setEtherscanApiKey, getEtherscanApiKey] =
  ipcSetterAndGetter<string>("etherscanApiKey");

export const showOpenDialog = (options: any) =>
  ipcTask("showOpenDialog")(options) as Promise<{
    canceled: boolean;
    filePaths: string[];
  }>;

export const getContract = (name: string) =>
  ipcTask("getContract")(name) as Promise<any>;

export const getContractSource = (name: string) =>
  ipcTask("getContractSource")(name);

export const openInExplorer = (...paths: string[]) =>
  ipcTask("openInExplorer")(paths);
// #endregion

// #region Factory
export const createFactory = (
  id: string,
  configuration: Partial<Configuration>,
  projectDir: string
) => ipcTask("createFactory")(id, configuration, projectDir);

export const factoryLoadSecrets = (id: string, secrets: Secrets) =>
  ipcTask("factoryLoadSecrets")(id, secrets);

export const factoryGetLayerByName = (id: string, layerName: string) =>
  ipcTaskWithRequestId("factoryGetLayerByName")(
    id,
    layerName
  ) as Promise<Layer>;

export const factoryGetTraitsByLayerName = (id: string, layerName: string) =>
  ipcTaskWithRequestId("factoryGetTraitsByLayerName")(id, layerName) as Promise<
    Trait[]
  >;

export const factoryGenerateCollection = (
  id: string,
  keys: string[],
  nTraits: Trait[][],
  ns: Record<string, number>,
  bundlesInfo: BundlesInfo
) =>
  ipcTask("factoryGenerateCollection")(
    id,
    keys,
    nTraits,
    ns,
    bundlesInfo
  ) as Promise<{ collection: Collection; bundles: Bundles }>;

export const factoryComputeMaxCombinations = (id: string, layers: Layer[]) =>
  ipcTaskWithRequestId("factoryComputeMaxCombinations")(
    id,
    layers
  ) as Promise<number>;

export const factoryComposeTraits = (
  id: string,
  traits: Trait[],
  maxSize?: number
) =>
  ipcTaskWithRequestId("factoryComposeTraits")(
    id,
    traits,
    maxSize
  ) as Promise<string>;

export const factoryGenerateImages = (
  id: string,
  name: string,
  collection: Collection,
  onProgress?: (name: string) => void
) =>
  ipcTaskWithProgress("factoryGenerateImages")(
    onProgress,
    id,
    name,
    collection
  );

export const factoryGenerateMetadata = (
  id: string,
  name: string,
  collection: Collection,
  metadataItems: MetadataItem[],
  onProgress?: (name: string) => void
) =>
  ipcTaskWithProgress("factoryGenerateMetadata")(
    onProgress,
    id,
    name,
    collection,
    metadataItems
  );

export const factoryDeployImages = (id: string) =>
  ipcTask("factoryDeployImages")(id);

export const factoryDeployMetadata = (id: string) =>
  ipcTask("factoryDeployMetadata")(id);

export const factoryGetTraitImage = (
  id: string,
  trait: Trait,
  maxSize?: number
) =>
  ipcTaskWithRequestId("factoryGetTraitImage")(
    id,
    trait,
    maxSize
  ) as Promise<string>;

export const factoryGetRandomTraitImage = (
  id: string,
  layer: Layer,
  maxSize?: number
) =>
  ipcTaskWithRequestId("factoryGetRandomTraitImage")(
    id,
    layer,
    maxSize
  ) as Promise<[Trait, string]>;

export const factoryGetImage = (
  id: string,
  name: string,
  collectionItem: CollectionItem,
  maxSize?: number
) =>
  ipcTaskWithRequestId("factoryGetImage")(
    id,
    name,
    collectionItem,
    maxSize
  ) as Promise<string>;

export const factoryGetRandomImage = (
  id: string,
  name: string,
  collection: Collection,
  maxSize?: number
) =>
  ipcTask("factoryGetRandomImage")(id, name, collection, maxSize) as Promise<
    [CollectionItem, string]
  >;

export const factoryRewriteImage = (
  id: string,
  collectionItem: CollectionItem,
  dataUrl: string
) =>
  ipcTask("factoryRewriteImage")(
    id,
    collectionItem,
    dataUrl
  ) as Promise<string>;

export const factoryRemoveCollectionItems = (
  id: string,
  name: string,
  collection: Collection,
  bundles: Bundles,
  collectionItems: Collection
) =>
  ipcTask("factoryRemoveCollectionItems")(
    id,
    name,
    collection,
    bundles,
    collectionItems
  ) as Promise<Collection>;

export const factoryRegenerateCollectionItems = (
  id: string,
  name: string,
  collection: Collection,
  collectionItems: Collection
) =>
  ipcTask("factoryRegenerateCollectionItems")(
    id,
    name,
    collection,
    collectionItems
  ) as Promise<Collection>;

export const factoryGenerateNotRevealedImage = (id: string, traits: Trait[]) =>
  ipcTask("factoryGenerateNotRevealedImage")(id, traits);

export const factoryGenerateNotRevealedMetadata = (id: string) =>
  ipcTask("factoryGenerateNotRevealedMetadata")(id);

export const factoryDeployNotRevealedImage = (id: string) =>
  ipcTask("factoryDeployNotRevealedImage")(id);

export const factoryDeployNotRevealedMetadata = (id: string) =>
  ipcTask("factoryDeployNotRevealedMetadata")(id);

export const factoryUnify = (
  id: string,
  name: string,
  generations: Generation[]
) =>
  ipcTask("factoryUnify")(id, name, generations) as Promise<{
    collection: Collection;
    bundles: Bundles;
  }>;

export const factoryRemove = (id: string, generation: Generation) =>
  ipcTask("factoryRemove")(id, generation);

// #endregion

export const AAA = () => ipcTask("AAA")() as Promise<string>;
