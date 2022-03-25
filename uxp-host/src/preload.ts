import { contextBridge, ipcRenderer } from "electron";

const sendWhitelist = [
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
  "layersNames",
  "compose",
  "name",
  "sizeOf",
  "verifyContract",
  "isValidInputDir",

  // Factory
  "createFactory",
  "createFactoryFromInstance",
  "factoryInstance",
  "factoryLoadInstance",
  "factorySaveInstance",
  "factoryLoadSecrets",
  "factoryGetLayerByName",
  "factoryGetTraitsByLayerName",
  "factoryGenerateCollection",
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
];

const onWhitelist = [
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
  "layersNamesResult",
  "composeResult",
  "nameResult",
  "sizeOfResult",
  "verifyContractResult",
  "isValidInputDirResult",

  // Factory
  "createFactoryResult",
  "createFactoryFromInstanceResult",
  "factoryInstanceResult",
  "factoryLoadInstanceResult",
  "factorySaveInstanceResult",
  "factoryLoadSecretsResult",
  "factoryGetLayerByNameResult",
  "factoryGetTraitsByLayerNameResult",
  "factoryGenerateCollectionResult",
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
