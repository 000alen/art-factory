const { contextBridge, ipcRenderer } = require("electron");

const sendWhitelist = [
  "writeFile",
  "mkDir",
  "showOpenDialog",
  "showSaveDialog",
  "createFactory",
  "factoryMaxCombinations",
  "factoryInstance",
  "factorySaveInstance",
  "factoryLoadInstance",
  "factoryEnsureLayers",
  "factoryEnsureOutputDir",
  "factoryGenerateRandomAttributes",
  "factoryGenerateAttributes",
  "factoryGenerateImages",
  "factoryGenerateMetadata",
  "factoryDeployImages",
  "factoryDeployMetadata",
  "factoryGetRandomImage",
  "factoryGetImage",
  "getContract",
  "getOutputDir",
  "setPinataApiKey",
  "getPinataApiKey",
  "setPinataSecretApiKey",
  "getPinataSecretApiKey",
  "setInfuraId",
  "getInfuraId",
];

const onWhitelist = [
  "writeFileResult",
  "mkDirResult",
  "showOpenDialogResult",
  "showSaveDialogResult",
  "createFactoryResult",
  "factoryMaxCombinationsResult",
  "factoryInstanceResult",
  "factorySaveInstanceResult",
  "factoryLoadInstanceResult",
  "factoryEnsureLayersResult",
  "factoryEnsureOutputDirResult",
  "factoryGenerateRandomAttributesResult",
  "factoryGenerateAttributesResult",
  "factoryGenerateImagesProgress",
  "factoryGenerateImagesResult",
  "factoryGenerateMetadataResult",
  "factoryDeployImagesResult",
  "factoryDeployMetadataResult",
  "factoryGetRandomImageResult",
  "factoryGetImageResult",
  "getContractResult",
  "getOutputDirResult",
  "setPinataApiKeyResult",
  "getPinataApiKeyResult",
  "setPinataSecretApiKeyResult",
  "getPinataSecretApiKeyResult",
  "setInfuraIdResult",
  "getInfuraIdResult",
];

contextBridge.exposeInMainWorld("ipcRenderer", {
  send: (channel, ...args) => {
    if (sendWhitelist.includes(channel)) {
      return ipcRenderer.send(channel, ...args);
    }
  },
  on: (channel, listener) => {
    if (onWhitelist.includes(channel)) {
      return ipcRenderer.on(channel, (event, ...args) => listener(...args));
    }
  },
  once: (channel, listener) => {
    if (onWhitelist.includes(channel)) {
      return ipcRenderer.once(channel, (event, ...args) => listener(...args));
    }
  },
  removeListener: (channel, listener) => {
    if (onWhitelist.includes(channel)) {
      return ipcRenderer.removeListener(channel, listener);
    }
  },
});
