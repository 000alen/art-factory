const { contextBridge, ipcRenderer } = require("electron");

const sendWhitelist = [
  "showOpenDialog",
  "showSaveDialog",
  "createFactory",
  "factoryMaxCombinations",
  "factoryInstance",
  "factoryLoadLayers",
  "factoryBootstrapOutput",
  "factoryGenerateRandomAttributes",
  "factoryGenerateAllAttributes",
  "factoryGenerateImages",
  "factoryGenerateMetadata",
  "factoryDeployImages",
  "factoryDeployMetadata",
  "factoryGetRandomGeneratedImage",
  "factoryGetImage",
];

const onWhitelist = [
  "showOpenDialogResult",
  "showSaveDialogResult",
  "createFactoryResult",
  "factoryMaxCombinationsResult",
  "factoryInstanceResult",
  "factoryLoadLayersResult",
  "factoryBootstrapOutputResult",
  "factoryGenerateRandomAttributesResult",
  "factoryGenerateAllAttributesResult",
  "factoryGenerateImagesProgress",
  "factoryGenerateImagesResult",
  "factoryGenerateMetadataResult",
  "factoryDeployImagesResult",
  "factoryDeployMetadataResult",
  "factoryGetRandomGeneratedImageResult",
  "factoryGetImageResult",
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
