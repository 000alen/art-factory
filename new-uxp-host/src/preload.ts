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
  send: (channel: string, ...args: any[]) => {
    if (sendWhitelist.includes(channel)) {
      ipcRenderer.send(channel, ...args);
    } else {
      throw new Error(`${channel} is not on the whitelist`);
    }
  },
  on: (channel: string, listener: (...args: any[]) => void) => {
    if (onWhitelist.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => listener(...args));
    } else {
      throw new Error(`${channel} is not on the whitelist`);
    }
  },
  once: (channel: string, listener: (...args: any[]) => void) => {
    if (onWhitelist.includes(channel)) {
      ipcRenderer.once(channel, (event, ...args) => listener(...args));
    } else {
      throw new Error(`${channel} is not on the whitelist`);
    }
  },
  removeListener: (channel: string, listener: (...args: any[]) => void) => {
    if (onWhitelist.includes(channel)) {
      ipcRenderer.removeListener(channel, listener);
    } else {
      throw new Error(`${channel} is not on the whitelist`);
    }
  },
});
