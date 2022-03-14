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
  "factoryGenerateImages",
  "factoryGenerateMetadata",
  "factoryDeployImages",
  "factoryDeployMetadata",
  "factoryGetRandomImage",
  "factoryGetImage",
  "getContract",
  "getContractSource",
  "getOutputDir",
  "setPinataApiKey",
  "getPinataApiKey",
  "setPinataSecretApiKey",
  "getPinataSecretApiKey",
  "setEtherscanApiKey",
  "getEtherscanApiKey",
  "setInfuraId",
  "getInfuraId",
  "factoryLoadSecrets",
  "layersNames",
  "factoryLoadProps",
  "factoryGetTraitImage",
  "factoryRewriteImage",
  "factoryGetRandomTraitImage",
  "compose",
  "factoryGenerateRandomAttributesFromNodes",
  "name",
  "sizeOf",
  "pinFileToIPFS",
  "verifyContract",
  "isValidInputDir",
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
  "factoryGenerateImagesProgress",
  "factoryGenerateImagesResult",
  "factoryGenerateMetadataResult",
  "factoryDeployImagesResult",
  "factoryDeployMetadataResult",
  "factoryGetRandomImageResult",
  "factoryGetImageResult",
  "getContractResult",
  "getContractSourceResult",
  "getOutputDirResult",
  "setPinataApiKeyResult",
  "getPinataApiKeyResult",
  "setPinataSecretApiKeyResult",
  "getPinataSecretApiKeyResult",
  "setInfuraIdResult",
  "getInfuraIdResult",
  "setEtherscanApiKeyResult",
  "getEtherscanApiKeyResult",
  "factoryLoadSecretsResult",
  "layersNamesResult",
  "factoryLoadPropsResult",
  "factoryGetTraitImageResult",
  "factoryRewriteImageResult",
  "factoryGetRandomTraitImageResult",
  "composeResult",
  "factoryGenerateRandomAttributesFromNodesResult",
  "nameResult",
  "sizeOfResult",
  "pinFileToIPFSResult",
  "verifyContractResult",
  "isValidInputDirResult",
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
