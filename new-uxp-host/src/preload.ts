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
  "setInfuraId",
  "getInfuraId",
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
  "setInfuraIdResult",
  "getInfuraIdResult",
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
];

contextBridge.exposeInMainWorld("ipcRenderer", {
  send: (channel: string, ...args: any[]) => {
    console.log("send");
    if (sendWhitelist.includes(channel)) {
      ipcRenderer.send(channel, ...args);
    } else {
      throw new Error(`${channel} is not on the whitelist`);
    }
  },
  on: (channel: string, listener: (...args: any[]) => void) => {
    console.log("on");

    if (onWhitelist.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => listener(...args));
    } else {
      throw new Error(`${channel} is not on the whitelist`);
    }
  },
  once: (channel: string, listener: (...args: any[]) => void) => {
    console.log("once");

    if (onWhitelist.includes(channel)) {
      ipcRenderer.once(channel, (event, ...args) => listener(...args));
    } else {
      throw new Error(`${channel} is not on the whitelist`);
    }
  },
  removeListener: (channel: string, listener: (...args: any[]) => void) => {
    console.log("removeListener");

    if (onWhitelist.includes(channel)) {
      ipcRenderer.removeListener(channel, listener);
    } else {
      throw new Error(`${channel} is not on the whitelist`);
    }
  },
});
