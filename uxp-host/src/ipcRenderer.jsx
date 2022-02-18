import { v4 as uuid } from "uuid";

export const showOpenDialog = (options) => {
  return new Promise((resolve, reject) => {
    window.ipcRenderer.once("showOpenDialogResult", (result) =>
      resolve(result)
    );

    window.ipcRenderer.send("showOpenDialog", options);
  });
};

export const showSaveDialog = (options) => {
  return new Promise((resolve, reject) => {
    window.ipcRenderer.once("showSaveDialogResult", (result) =>
      resolve(result)
    );

    window.ipcRenderer.send("showSaveDialog", options);
  });
};

export const createFactory = (id, config, inputDir, outputDir) => {
  return new Promise((resolve, reject) => {
    window.ipcRenderer.once("createFactoryResult", (result) => resolve(result));

    window.ipcRenderer.send("createFactory", id, config, inputDir, outputDir);
  });
};

export const factoryMaxCombinations = (id) => {
  return new Promise((resolve, reject) => {
    window.ipcRenderer.once("factoryMaxCombinationsResult", (result) =>
      resolve(result)
    );

    window.ipcRenderer.send("factoryMaxCombinations", id);
  });
};

export const factoryInstance = (id) => {
  return new Promise((resolve, reject) => {
    window.ipcRenderer.once("factoryInstanceResult", (result) =>
      resolve(result)
    );

    window.ipcRenderer.send("factoryInstance", id);
  });
};

export const factoryLoadLayers = (id) => {
  return new Promise((resolve, reject) => {
    window.ipcRenderer.once("factoryLoadLayersResult", (result) =>
      resolve(result)
    );

    window.ipcRenderer.send("factoryLoadLayers", id);
  });
};

export const factoryBootstrapOutput = (id) => {
  return new Promise((resolve, reject) => {
    window.ipcRenderer.once("factoryBootstrapOutputResult", (result) =>
      resolve(result)
    );

    window.ipcRenderer.send("factoryBootstrapOutput", id);
  });
};

export const factoryGenerateRandomAttributes = (id, n) => {
  return new Promise((resolve, reject) => {
    window.ipcRenderer.once("factoryGenerateRandomAttributesResult", (result) =>
      resolve(result)
    );

    window.ipcRenderer.send("factoryGenerateRandomAttributes", id, n);
  });
};

export const factoryGenerateAllAttributes = (id) => {
  return new Promise((resolve, reject) => {
    window.ipcRenderer.once("factoryGenerateAllAttributesResult", (result) =>
      resolve(result)
    );

    window.ipcRenderer.send("factoryGenerateAllAttributes", id);
  });
};

export const factoryGenerateImages = (id, attributes, onProgress) => {
  return new Promise((resolve, reject) => {
    const _onProgress = ({ id: _id, i }) => {
      if (_id === id && onProgress !== undefined) onProgress(i);
    };
    const onResult = (result) => {
      window.ipcRenderer.removeListener(
        "factoryGenerateImagesProgress",
        _onProgress
      );
      resolve(result);
    };

    window.ipcRenderer.on("factoryGenerateImagesProgress", _onProgress);
    window.ipcRenderer.once("factoryGenerateImagesResult", onResult);
    window.ipcRenderer.send("factoryGenerateImages", id, attributes);
  });
};

export const factoryGenerateMetadata = (id, cid, attributes) => {
  return new Promise((resolve, reject) => {
    window.ipcRenderer.once("factoryGenerateMetadataResult", (result) =>
      resolve(result)
    );

    window.ipcRenderer.send("factoryGenerateMetadata", id, cid, attributes);
  });
};

export const factoryDeployImages = (id) => {
  return new Promise((resolve, reject) => {
    window.ipcRenderer.once("factoryDeployImagesResult", (result) =>
      resolve(result)
    );

    window.ipcRenderer.send("factoryDeployImages", id);
  });
};

export const factoryDeployMetadata = (id) => {
  return new Promise((resolve, reject) => {
    window.ipcRenderer.once("factoryDeployMetadataResult", (result) =>
      resolve(result)
    );

    window.ipcRenderer.send("factoryDeployMetadata", id);
  });
};

export const factoryGetRandomGeneratedImage = (id, attributes) => {
  return new Promise((resolve, reject) => {
    window.ipcRenderer.once("factoryGetRandomGeneratedImageResult", (result) =>
      resolve(result)
    );

    window.ipcRenderer.send("factoryGetRandomGeneratedImage", id, attributes);
  });
};

export const factoryGetImage = (id, index) => {
  const requestId = uuid();

  return new Promise((resolve, reject) => {
    const listener = (_requestId, result) => {
      if (_requestId === requestId) {
        window.ipcRenderer.removeListener("factoryGetImageResult", listener);
        resolve(result);
      }
    };

    window.ipcRenderer.on("factoryGetImageResult", listener);
    window.ipcRenderer.send("factoryGetImage", id, requestId, index);
  });
};

export const getContract = (name) => {
  return new Promise((resolve, reject) => {
    window.ipcRenderer.once("getContractResult", (result) => resolve(result));

    window.ipcRenderer.send("getContract", name);
  });
};

export const getOutputDir = (inputDir) => {
  return new Promise((resolve, reject) => {
    window.ipcRenderer.once("getOutputDirResult", (result) => resolve(result));

    window.ipcRenderer.send("getOutputDir", inputDir);
  });
};
