import { contextBridge, ipcRenderer } from "electron";

const sendWhitelist = [
  "readProjectInstance",
  "ensureProjectStructure",
  "writeProjectInstance",
  "readProjectAvailableLayers",
  "hasFactory",

  "writeFile",
  "mkDir",
  "showOpenDialog",
  "showSaveDialog",
  "getContract",
  "getContractSource",
  "getOutputDir",
  "setPinataApiKey",
  "getPinataApiKey",
  "setPinataSecretApiKey",
  "getPinataSecretApiKey",
  "setEtherscanApiKey",
  "getEtherscanApiKey",
  "setInfuraProjectId",
  "getInfuraProjectId",
  "compose",
  "name",
  "sizeOf",
  "isValidInputDir",
  "openFolder",

  // Factory
  "createFactory",
  "factoryLoadSecrets",
  "factoryGetLayerByName",
  "factoryGetTraitsByLayerName",
  "factoryGenerateCollection",
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
  "factoryRewriteImage",
  "factoryRemoveCollectionItems",
  "factoryRegenerateCollectionItems",
  "factoryGenerateNotRevealedImage",
  "factoryGenerateNotRevealedMetadata",
  "factoryDeployNotRevealedImage",
  "factoryDeployNotRevealedMetadata",
];

const onWhitelist = [
  "readProjectInstanceResult",
  "ensureProjectStructureResult",
  "writeProjectInstanceResult",
  "readProjectAvailableLayersResult",
  "hasFactoryResult",

  "openFolderResult",

  "writeFileResult",
  "mkDirResult",
  "showOpenDialogResult",
  "showSaveDialogResult",
  "getContractResult",
  "getContractSourceResult",
  "getOutputDirResult",
  "setPinataApiKeyResult",
  "getPinataApiKeyResult",
  "setPinataSecretApiKeyResult",
  "getPinataSecretApiKeyResult",
  "setInfuraProjectIdResult",
  "getInfuraProjectIdResult",
  "setEtherscanApiKeyResult",
  "getEtherscanApiKeyResult",
  "composeResult",
  "nameResult",
  "sizeOfResult",
  "isValidInputDirResult",

  // Factory
  "createFactoryResult",
  "factoryLoadSecretsResult",
  "factoryGetLayerByNameResult",
  "factoryGetTraitsByLayerNameResult",
  "factoryGenerateCollectionResult",
  "factoryComputeMaxCombinationsResult",
  "factoryComposeTraitsResult",
  "factoryGenerateImagesResult",
  "factoryGenerateImagesProgress",
  "factoryGenerateMetadataResult",
  "factoryGenerateMetadataProgress",
  "factoryDeployImagesResult",
  "factoryDeployMetadataResult",
  "factoryGetTraitImageResult",
  "factoryGetRandomTraitImageResult",
  "factoryGetImageResult",
  "factoryGetRandomImageResult",
  "factoryRewriteImageResult",
  "factoryRemoveCollectionItemsResult",
  "factoryRegenerateCollectionItemsResult",
  "factoryGenerateNotRevealedImageResult",
  "factoryGenerateNotRevealedMetadataResult",
  "factoryDeployNotRevealedImageResult",
  "factoryDeployNotRevealedMetadataResult",
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
