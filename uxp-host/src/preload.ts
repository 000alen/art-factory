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
  "factoryDeployImages",
  "factoryDeployMetadata",
  "factoryGetTraitImage",
  "factoryGetRandomTraitImage",
  "factoryGetImage",
  "factoryGetRandomImage",
  "factoryRemoveItems",
  "factoryRegenerateItems",
  "factoryDeployNotRevealedImage",
  "factoryDeployNotRevealedMetadata",
  "factoryUnify",
  "factoryRemove",

  "createProvider",
  "createProviderUri",
  "createProviderResult",
];

const onWhitelist = [
  "getPinataApiKey",
  "getPinataSecretApiKey",
  "getInfuraProjectId",
  "getEtherscanApiKey",
  "setPinataApiKey",
  "setPinataSecretApiKey",
  "setInfuraProjectId",
  "setEtherscanApiKey",

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
  "factoryDeployImagesResult",
  "factoryDeployMetadataResult",
  "factoryGetTraitImageResult",
  "factoryGetRandomTraitImageResult",
  "factoryGetImageResult",
  "factoryGetRandomImageResult",
  "factoryRemoveItemsResult",
  "factoryRegenerateItemsResult",
  "factoryDeployNotRevealedImageResult",
  "factoryDeployNotRevealedMetadataResult",
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
