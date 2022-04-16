import { contextBridge, ipcRenderer } from "electron";

const sendWhitelist = [
  "getPinataApiKey",
  "getPinataSecretApiKey",
  "getInfuraProjectId",
  "getEtherscanApiKey",
  "setPinataApiKey",
  "setPinataSecretApiKey",
  "setInfuraProjectId",
  "setEtherscanApiKey",

  "showOpenDialog",
  "openInExplorer",

  "readProjectInstance",
  "ensureProjectStructure",
  "writeProjectInstance",
  "readProjectAvailableLayers",
  "hasFactory",
  "createFactory",
  "factoryLoadSecrets",
  "factoryGetLayerByName",
  "factoryGetTraitsByLayerName",
  "factoryMakeGeneration",
  "factoryComputeMaxCombinations",
  "factoryComposeTraits",
  "factoryGenerateImages",
  "factoryGenerateMetadata",
  "factoryDeploy",
  "factoryGetTraitImage",
  "factoryGetRandomTraitImage",
  "factoryGetImage",
  "factoryGetRandomImage",
  "factoryRemoveItems",
  "factoryRegenerateItems",
  "factoryUnify",
  "factoryRemove",

  "createProvider",
  "createProviderUri",
  "createProviderResult",
];

const onWhitelist = [
  "getPinataApiKeyResult",
  "getPinataSecretApiKeyResult",
  "getInfuraProjectIdResult",
  "getEtherscanApiKeyResult",
  "setPinataApiKeyResult",
  "setPinataSecretApiKeyResult",
  "setInfuraProjectIdResult",
  "setEtherscanApiKeyResult",

  "showOpenDialogResult",
  "openInExplorerResult",

  "readProjectInstanceResult",
  "ensureProjectStructureResult",
  "writeProjectInstanceResult",
  "readProjectAvailableLayersResult",
  "hasFactoryResult",
  "createFactoryResult",
  "factoryLoadSecretsResult",
  "factoryGetLayerByNameResult",
  "factoryGetTraitsByLayerNameResult",
  "factoryMakeGenerationResult",
  "factoryComputeMaxCombinationsResult",
  "factoryComposeTraitsResult",
  "factoryGenerateImagesProgress",
  "factoryGenerateImagesResult",
  "factoryGenerateMetadataProgress",
  "factoryGenerateMetadataResult",
  "factoryDeployResult",
  "factoryGetTraitImageResult",
  "factoryGetRandomTraitImageResult",
  "factoryGetImageResult",
  "factoryGetRandomImageResult",
  "factoryRemoveItemsResult",
  "factoryRegenerateItemsResult",
  "factoryUnifyResult",
  "factoryRemoveResult",

  "createProvider",
  "createProviderUri",
  "createProviderResult",
];

contextBridge.exposeInMainWorld("ipcRenderer", {
  send: (channel: string, ...args: any[]) => {
    if (sendWhitelist.includes(channel)) {
      return ipcRenderer.send(channel, ...(args === undefined ? [] : args));
    } else {
      throw new Error(`${channel} is not on the whitelist`);
    }
  },
  on: (channel: string, listener: (...args: any[]) => void) => {
    if (onWhitelist.includes(channel)) {
      return ipcRenderer.on(channel, (event, ...args) =>
        listener(...(args === undefined ? [] : args))
      );
    } else {
      throw new Error(`${channel} is not on the whitelist`);
    }
  },
  once: (channel: string, listener: (...args: any[]) => void) => {
    if (onWhitelist.includes(channel)) {
      return ipcRenderer.once(channel, (event, ...args) =>
        listener(...(args === undefined ? [] : args))
      );
    } else {
      throw new Error(`${channel} is not on the whitelist`);
    }
  },
  removeListener: (channel: string, listener: (...args: any[]) => void) => {
    if (onWhitelist.includes(channel)) {
      return ipcRenderer.removeListener(channel, listener);
    } else {
      throw new Error(`${channel} is not on the whitelist`);
    }
  },
});
