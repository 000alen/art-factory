import { v4 as uuid } from "uuid";

export const mkDir = (dir, options) => {
  return new Promise((resolve, reject) => {
    window.ipcRenderer.once("mkDirResult", (result) => resolve(result));

    window.ipcRenderer.send("mkDir", dir, options);
  });
};

export const writeFile = (file, data, options) => {
  return new Promise((resolve, reject) => {
    window.ipcRenderer.once("writeFileResult", (result) => resolve(result));

    window.ipcRenderer.send("writeFile", file, data, options);
  });
};

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

export const createFactory = (id, config, inputDir, outputDir, props) => {
  return new Promise((resolve, reject) => {
    window.ipcRenderer.once("createFactoryResult", (result) => resolve(result));

    window.ipcRenderer.send(
      "createFactory",
      id,
      config,
      inputDir,
      outputDir,
      props
    );
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

export const factorySaveInstance = (id) => {
  return new Promise((resolve, reject) => {
    window.ipcRenderer.once("factorySaveInstanceResult", (result) =>
      resolve(result)
    );

    window.ipcRenderer.send("factorySaveInstance", id);
  });
};

export const factoryLoadInstance = (id, instancePath) => {
  return new Promise((resolve, reject) => {
    window.ipcRenderer.once("factoryLoadInstanceResult", (result) =>
      resolve(result)
    );

    window.ipcRenderer.send("factoryLoadInstance", id, instancePath);
  });
};

export const factoryEnsureLayers = (id) => {
  return new Promise((resolve, reject) => {
    window.ipcRenderer.once("factoryEnsureLayersResult", (result) =>
      resolve(result)
    );

    window.ipcRenderer.send("factoryEnsureLayers", id);
  });
};

export const factoryEnsureOutputDir = (id) => {
  return new Promise((resolve, reject) => {
    window.ipcRenderer.once("factoryEnsureOutputDirResult", (result) =>
      resolve(result)
    );

    window.ipcRenderer.send("factoryEnsureOutputDir", id);
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

export const factoryGenerateAttributes = (id) => {
  return new Promise((resolve, reject) => {
    window.ipcRenderer.once("factoryGenerateAttributesResult", (result) =>
      resolve(result)
    );

    window.ipcRenderer.send("factoryGenerateAttributes", id);
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

export const factoryGetRandomImage = (id, attributes) => {
  return new Promise((resolve, reject) => {
    window.ipcRenderer.once("factoryGetRandomImageResult", (result) =>
      resolve(result)
    );

    window.ipcRenderer.send("factoryGetRandomImage", id, attributes);
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
