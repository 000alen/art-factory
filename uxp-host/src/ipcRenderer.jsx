export const showOpenDialog = (...args) => {
  return new Promise((resolve, reject) => {
    window.ipcRenderer.once("showOpenDialogResult", (result) =>
      resolve(result)
    );

    window.ipcRenderer.send("showOpenDialog", ...args);
  });
};

export const showSaveDialog = (...args) => {
  return new Promise((resolve, reject) => {
    window.ipcRenderer.once("showSaveDialogResult", (result) =>
      resolve(result)
    );

    window.ipcRenderer.send("showSaveDialog", ...args);
  });
};

export const createFactory = (...args) => {
  return new Promise((resolve, reject) => {
    window.ipcRenderer.once("createFactoryResult", (result) => resolve(result));

    window.ipcRenderer.send("createFactory", ...args);
  });
};

export const factoryMaxCombinations = (...args) => {
  return new Promise((resolve, reject) => {
    window.ipcRenderer.once("factoryMaxCombinationsResult", (result) =>
      resolve(result)
    );

    window.ipcRenderer.send("factoryMaxCombinations", ...args);
  });
};

export const factoryInstance = (...args) => {
  return new Promise((resolve, reject) => {
    window.ipcRenderer.once("factoryInstanceResult", (result) =>
      resolve(result)
    );

    window.ipcRenderer.send("factoryInstance", ...args);
  });
};

export const factoryLoadLayers = (...args) => {
  return new Promise((resolve, reject) => {
    window.ipcRenderer.once("factoryLoadLayersResult", (result) =>
      resolve(result)
    );

    window.ipcRenderer.send("factoryLoadLayers", ...args);
  });
};

export const factoryBootstrapOutput = (...args) => {
  return new Promise((resolve, reject) => {
    window.ipcRenderer.once("factoryBootstrapOutputResult", (result) =>
      resolve(result)
    );

    window.ipcRenderer.send("factoryBootstrapOutput", ...args);
  });
};

export const factoryGenerateRandomAttributes = (...args) => {
  return new Promise((resolve, reject) => {
    window.ipcRenderer.once("factoryGenerateRandomAttributesResult", (result) =>
      resolve(result)
    );

    window.ipcRenderer.send("factoryGenerateRandomAttributes", ...args);
  });
};

export const factoryGenerateAllAttributes = (...args) => {
  return new Promise((resolve, reject) => {
    window.ipcRenderer.once("factoryGenerateAllAttributesResult", (result) =>
      resolve(result)
    );

    window.ipcRenderer.send("factoryGenerateAllAttributes", ...args);
  });
};

export const factoryGenerateImages = (...args) => {
  return new Promise((resolve, reject) => {
    window.ipcRenderer.once("factoryGenerateImagesResult", (result) =>
      resolve(result)
    );

    window.ipcRenderer.send("factoryGenerateImages", ...args);
  });
};

export const factoryGenerateMetadata = (...args) => {
  return new Promise((resolve, reject) => {
    window.ipcRenderer.once("factoryGenerateMetadataResult", (result) =>
      resolve(result)
    );

    window.ipcRenderer.send("factoryGenerateMetadata", ...args);
  });
};

export const factoryDeployImages = (...args) => {
  return new Promise((resolve, reject) => {
    window.ipcRenderer.once("factoryDeployImagesResult", (result) =>
      resolve(result)
    );

    window.ipcRenderer.send("factoryDeployImages", ...args);
  });
};

export const factoryDeployMetadata = (...args) => {
  return new Promise((resolve, reject) => {
    window.ipcRenderer.once("factoryDeployMetadataResult", (result) =>
      resolve(result)
    );

    window.ipcRenderer.send("factoryDeployMetadata", ...args);
  });
};
