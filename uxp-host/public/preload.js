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
  "factoryLoadSecrets",
  "layersNames",
  "factorySetProps",
  "factoryGetTraitImage",
  "factoryRewriteImage",
  "factoryGetRandomTraitImage",
  "compose",
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
  "factoryLoadSecretsResult",
  "layersNamesResult",
  "factorySetPropsResult",
  "factoryGetTraitImageResult",
  "factoryRewriteImageResult",
  "factoryGetRandomTraitImageResult",
  "composeResult",
];

contextBridge.exposeInMainWorld("ipcRenderer", {
  send: (channel, ...args) => {
    if (sendWhitelist.includes(channel)) {
      return ipcRenderer.send(channel, ...args);
    } else {
      throw new Error(`${channel} is not on the whitelist`);
    }
  },
  on: (channel, listener) => {
    if (onWhitelist.includes(channel)) {
      return ipcRenderer.on(channel, (event, ...args) => listener(...args));
    } else {
      throw new Error(`${channel} is not on the whitelist`);
    }
  },
  once: (channel, listener) => {
    if (onWhitelist.includes(channel)) {
      return ipcRenderer.once(channel, (event, ...args) => listener(...args));
    } else {
      throw new Error(`${channel} is not on the whitelist`);
    }
  },
  removeListener: (channel, listener) => {
    if (onWhitelist.includes(channel)) {
      return ipcRenderer.removeListener(channel, listener);
    } else {
      throw new Error(`${channel} is not on the whitelist`);
    }
  },
});
