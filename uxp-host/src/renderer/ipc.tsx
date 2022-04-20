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
  Template,
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

// #region Property
export const [setPinataApiKey, getPinataApiKey] =
  ipcSetterAndGetter<string>("pinataApiKey");

export const [setPinataSecretApiKey, getPinataSecretApiKey] =
  ipcSetterAndGetter<string>("pinataSecretApiKey");

export const [setInfuraProjectId, getInfuraProjectId] =
  ipcSetterAndGetter<string>("infuraProjectId");

export const [setEtherscanApiKey, getEtherscanApiKey] =
  ipcSetterAndGetter<string>("etherscanApiKey");
// #endregion

// #region General
export const showOpenDialog = (options: any) =>
  ipcTask("showOpenDialog")(options) as Promise<{
    canceled: boolean;
    filePaths: string[];
  }>;

export const openInExplorer = (...paths: string[]) =>
  ipcTask("openInExplorer")(paths);
// #endregion

// #region Factory
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

export const createFactory = (
  id: string,
  configuration: Partial<Configuration>,
  projectDir: string
) => ipcTask("createFactory")(id, configuration, projectDir);

export const factoryReloadConfiguration = (
  id: string,
  configuration: Configuration
) => ipcTask("factoryReloadConfiguration")(id, configuration);

export const factoryReloadLayers = (id: string) =>
  ipcTask("factoryReloadLayers")(id);

export const factoryGetLayerByName = (id: string, layerName: string) =>
  ipcTaskWithRequestId("factoryGetLayerByName")(
    id,
    layerName
  ) as Promise<Layer>;

export const factoryGetTraitsByLayerName = (id: string, layerName: string) =>
  ipcTaskWithRequestId("factoryGetTraitsByLayerName")(id, layerName) as Promise<
    Trait[]
  >;

export const factoryMakeGeneration = (
  id: string,
  name: string,
  template: Template
) =>
  ipcTask("factoryMakeGeneration")(id, name, template) as Promise<Generation>;

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
  generation: Generation,
  onProgress?: (name: string) => void
) => ipcTaskWithProgress("factoryGenerateImages")(onProgress, id, generation);

export const factoryGenerateMetadata = (
  id: string,
  generation: Generation,
  items: MetadataItem[],
  onProgress?: (name: string) => void
) =>
  ipcTaskWithProgress("factoryGenerateMetadata")(
    onProgress,
    id,
    generation,
    items
  );

export const factoryDeploy = (
  id: string,
  providerId: string,
  generation: Generation,
  notRevealedGeneration?: Generation
) =>
  ipcTask("factoryDeploy")(
    id,
    providerId,
    generation,
    notRevealedGeneration
  ) as Promise<{
    imagesCid: string;
    metadataCid: string;
    notRevealedImageCid?: string;
    notRevealedMetadataCid?: string;
    contractAddress: string;
    abi: any;
    compilerVersion: string;
    transactionHash: string;
  }>;

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
  generation: Generation,
  item: CollectionItem,
  maxSize?: number
) =>
  ipcTaskWithRequestId("factoryGetImage")(
    id,
    generation,
    item,
    maxSize
  ) as Promise<string>;

export const factoryGetRandomImage = (
  id: string,
  generation: Generation,
  maxSize?: number
) =>
  ipcTask("factoryGetRandomImage")(id, generation, maxSize) as Promise<
    [CollectionItem, string]
  >;

export const factoryRemoveItems = (
  id: string,
  generation: Generation,
  items: Collection
) =>
  ipcTask("factoryRemoveItems")(id, generation, items) as Promise<Collection>;

export const factoryRegenerateItems = (
  id: string,
  generation: Generation,
  items: Collection
) =>
  ipcTask("factoryRegenerateItems")(
    id,
    generation,
    items
  ) as Promise<Generation>;

export const factoryReplaceItems = (
  id: string,
  generation: Generation,
  _with: Collection
) =>
  ipcTask("factoryReplaceItems")(id, generation, _with) as Promise<Generation>;

export const factoryUnify = (
  id: string,
  name: string,
  generations: Generation[]
) => ipcTask("factoryUnify")(id, name, generations) as Promise<Generation>;

export const factoryRemove = (id: string, generation: Generation) =>
  ipcTask("factoryRemove")(id, generation);

export const getCost = (id: string, contractId: string) =>
  ipcTask("getCost")(id, contractId);

export const getBalanceOf = (id: string, contractId: string, address: string) =>
  ipcTask("getBalanceOf")(id, contractId, address);

export const getTokenOfOwnerByIndex = (
  id: string,
  contractId: string,
  address: string,
  index: number
) => ipcTask("getTokenOfOwnerByIndex")(id, contractId, address, index);

export const getTokenUri = (id: string, contractId: string, index: number) =>
  ipcTask("getTokenUri")(id, contractId, index);

export const mint = (
  id: string,
  contractId: string,
  payable: string,
  mint: number
) => ipcTask("mint")(id, contractId, payable, mint);

export const getWalletOfOwner = (
  id: string,
  contractId: string,
  owner: string
) => ipcTask("getWalletOfOwner")(id, contractId, owner);

export const setCost = (id: string, contractId: string, cost: string) =>
  ipcTask("setCost")(id, contractId, cost);

export const setMaxMintAmount = (
  id: string,
  contractId: string,
  amount: number
) => ipcTask("setMaxMintAmount")(id, contractId, amount);

export const withdraw = (id: string, contractId: string) =>
  ipcTask("withdraw")(id, contractId);

export const pause = (id: string, contractId: string) =>
  ipcTask("pause")(id, contractId);

export const setBaseUri = (id: string, contractId: string, baseUri: string) =>
  ipcTask("setBaseUri")(id, contractId, baseUri);

export const reveal = (id: string, contractId: string) =>
  ipcTask("reveal")(id, contractId);

// #endregion

// #region Provider
export const createProvider = (
  id: string,
  callback: ({ connected }: { connected: boolean }) => void
) =>
  new Promise<string>((resolve) => {
    const onCreateProviderUri = ({
      id: _id,
      uri,
    }: {
      id: string;
      uri: string;
    }) => {
      if (_id !== id) return;
      window.ipcRenderer.removeListener(
        "createProviderUri",
        onCreateProviderUri
      );
      resolve(uri);
    };

    const onCreateProviderResult = ({
      id: _id,
      connected,
    }: {
      id: string;
      connected: boolean;
    }) => {
      if (_id !== id) return;
      window.ipcRenderer.removeListener(
        "createProviderResult",
        onCreateProviderResult
      );
      callback({ connected });
    };

    window.ipcRenderer.on("createProviderUri", onCreateProviderUri);
    window.ipcRenderer.on("createProviderResult", onCreateProviderResult);
    window.ipcRenderer.send("createProvider", id);
  });
// #endregion

// #region Contract
export const createContract = (
  id: string,
  providerId: string,
  contractAddress: string,
  abi: any
) =>
  ipcTask("createContract")(
    id,
    providerId,
    contractAddress,
    abi
  ) as Promise<string>;

// #endregion
