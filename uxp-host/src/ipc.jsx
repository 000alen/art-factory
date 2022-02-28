import { v4 as uuid } from "uuid";
import { capitalize } from "./utils";

const ipcTask =
  (task) =>
  (...args) =>
    new Promise((resolve, reject) => {
      window.ipcRenderer.once(`${task}Result`, ({ error, result }) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
      window.ipcRenderer.send(task, ...args);
    });

const ipcTaskWithProgress =
  (task) =>
  (onProgress, id, ...args) =>
    new Promise((resolve, reject) => {
      const _onProgress = ({ id: _id, i }) => {
        if (_id === id && onProgress !== undefined) onProgress(i);
      };

      const _onResult = ({ error, result }) => {
        window.ipcRenderer.removeListener(`${task}Progress`, _onProgress);
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      };

      window.ipcRenderer.on(`${task}Progress`, _onProgress);
      window.ipcRenderer.once(`${task}Result`, _onResult);
      window.ipcRenderer.send(task, id, ...args);
    });

const ipcTaskWithRequestId =
  (task) =>
  (...args) => {
    const requestId = uuid();
    return new Promise((resolve, reject) => {
      const _onResult = ({ requestId: _requestId, error, result }) => {
        if (_requestId === requestId) {
          window.ipcRenderer.removeListener(`${task}Result`, _onResult);

          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      };

      window.ipcRenderer.on(`${task}Result`, _onResult);
      window.ipcRenderer.send(task, requestId, ...args);
    });
  };

const ipcSetterAndGetter = (property) => [
  (value) => ipcTask(`set${capitalize(property)}`)(value),
  () => ipcTask(`get${capitalize(property)}`)(),
];

export const [setPinataApiKey, getPinataApiKey] =
  ipcSetterAndGetter("pinataApiKey");

export const [setPinataSecretApiKey, getPinataSecretApiKey] =
  ipcSetterAndGetter("pinataSecretApiKey");

export const [setInfuraId, getInfuraId] = ipcSetterAndGetter("infuraId");

export const mkDir = (dir, options) => ipcTask("mkDir")(dir, options);

export const writeFile = (file, data, options) =>
  ipcTask("writeFile")(file, data, options);

export const showOpenDialog = (options) => ipcTask("showOpenDialog")(options);

export const showSaveDialog = (options) => ipcTask("showSaveDialog")(options);

export const createFactory = (id, config, inputDir, outputDir, props) =>
  ipcTask("createFactory")(id, config, inputDir, outputDir, props);

export const factorySetProps = (id, props) =>
  ipcTask("factorySetProps")(id, JSON.stringify(props));

export const factoryGetImage = (id, index) =>
  ipcTaskWithRequestId("factoryGetImage")(id, index);

export const factoryGenerateImages = (id, attributes, onProgress) =>
  ipcTaskWithProgress("factoryGenerateImages")(onProgress, id, attributes);

export const factoryMaxCombinations = (id) =>
  ipcTask("factoryMaxCombinations")(id);

export const layersNames = (inputDir) => ipcTask("layersNames")(inputDir);

export const factoryInstance = (id) => ipcTask("factoryInstance")(id);

export const factorySaveInstance = (id) => ipcTask("factorySaveInstance")(id);

export const factoryLoadInstance = (id, instancePath) =>
  ipcTask("factoryLoadInstance")(id, instancePath);

export const factoryEnsureLayers = (id) => ipcTask("factoryEnsureLayers")(id);

export const factoryEnsureOutputDir = (id) =>
  ipcTask("factoryEnsureOutputDir")(id);

export const factoryGenerateRandomAttributes = (id, n) =>
  ipcTask("factoryGenerateRandomAttributes")(id, n);

export const factoryGenerateAttributes = (id) =>
  ipcTask("factoryGenerateAttributes")(id);

export const factoryGenerateMetadata = (id, cid, attributes) =>
  ipcTask("factoryGenerateMetadata")(id, cid, attributes);

export const factoryDeployImages = (id) => ipcTask("factoryDeployImages")(id);

export const factoryDeployMetadata = (id) =>
  ipcTask("factoryDeployMetadata")(id);

export const factoryGetRandomImage = (id, attributes) =>
  ipcTask("factoryGetRandomImage")(id, attributes);

export const factoryLoadSecrets = (id, secrets) =>
  ipcTask("factoryLoadSecrets")(id, secrets);

export const getContract = (name) => ipcTask("getContract")(name);

export const getOutputDir = (inputDir) => ipcTask("getOutputDir")(inputDir);

export const factoryGetTraitImage = (id, trait) =>
  ipcTaskWithRequestId("factoryGetTraitImage")(id, trait);

export const factoryRewriteImage = (id, i, dataURL) =>
  ipcTask("factoryRewriteImage")(id, i, dataURL);

export const factoryGetRandomTraitImage = (id, layersName) =>
  ipcTaskWithRequestId("factoryGetRandomTraitImage")(id, layersName);

export const compose = (...buffers) =>
  ipcTaskWithRequestId("compose")(...buffers);

export const factoryGenerateRandomAttributesFromNodes = (id, nodes) =>
  ipcTask("factoryGenerateRandomAttributesFromNodes")(id, nodes);

export const name = (inputDir) => ipcTask("name")(inputDir);

export const sizeOf = (inputDir) => ipcTask("sizeOf")(inputDir);
