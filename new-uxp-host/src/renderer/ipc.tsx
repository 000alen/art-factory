declare global {
  interface Window {
    ipcRenderer: {
      send: (channel: string, ...args: any[]) => void;
      on: (channel: string, listener: (...args: any[]) => void) => void;
      once: (channel: string, listener: (...args: any[]) => void) => void;
      removeListener: (
        channel: string,
        listener: (...args: any[]) => void
      ) => void;
    };
  }
}

import { v4 as uuid } from "uuid";
import { capitalize } from "./utils";

const ipcTask =
  (task: string) =>
  (...args: any[]) =>
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
  (task: string) =>
  (onProgress: (i: number) => void, id: string, ...args: any[]) =>
    new Promise((resolve, reject) => {
      const _onProgress = ({ id: _id, i }: { id: string; i: number }) => {
        if (_id === id && onProgress !== undefined) onProgress(i);
      };

      const _onResult = ({ error, result }: { error: any; result: any }) => {
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
  (task: string) =>
  (...args: any[]) => {
    const requestId = uuid();
    return new Promise((resolve, reject) => {
      const _onResult = ({
        requestId: _requestId,
        error,
        result,
      }: {
        requestId: string;
        error: any;
        result: any;
      }) => {
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

const ipcSetterAndGetter = (property: string) => [
  (value: any) => ipcTask(`set${capitalize(property)}`)(value),
  () => ipcTask(`get${capitalize(property)}`)(),
];

export const [setPinataApiKey, getPinataApiKey] =
  ipcSetterAndGetter("pinataApiKey");

export const [setPinataSecretApiKey, getPinataSecretApiKey] =
  ipcSetterAndGetter("pinataSecretApiKey");

export const [setInfuraId, getInfuraId] = ipcSetterAndGetter("infuraId");

export const [setEtherscanApiKey, getEtherscanApiKey] =
  ipcSetterAndGetter("etherscanApiKey");

export const mkDir = (dir: string, options: any) =>
  ipcTask("mkDir")(dir, options);

export const writeFile = (file: string, data: any, options: any) =>
  ipcTask("writeFile")(file, data, options);

export const showOpenDialog = (options: any) =>
  ipcTask("showOpenDialog")(options);

export const showSaveDialog = (options: any) =>
  ipcTask("showSaveDialog")(options);

export const createFactory = (
  id: string,
  config: any,
  inputDir: string,
  outputDir: string,
  props?: any
) => ipcTask("createFactory")(id, config, inputDir, outputDir, props);

export const factoryLoadProps = (id: string, props: any) =>
  ipcTask("factoryLoadProps")(id, JSON.stringify(props));

export const factoryGetImage = (id: string, index: number, maxSize: number) =>
  ipcTaskWithRequestId("factoryGetImage")(id, index, maxSize);

export const factoryGenerateImages = (
  id: string,
  attributes: any,
  onProgress: (i: number) => void
) => ipcTaskWithProgress("factoryGenerateImages")(onProgress, id, attributes);

export const factoryMaxCombinations = (id: string) =>
  ipcTask("factoryMaxCombinations")(id);

export const layersNames = (inputDir: string) =>
  ipcTask("layersNames")(inputDir);

export const factoryInstance = (id: string) => ipcTask("factoryInstance")(id);

export const factorySaveInstance = (id: string) =>
  ipcTask("factorySaveInstance")(id);

export const factoryLoadInstance = (id: string, instancePath: string) =>
  ipcTask("factoryLoadInstance")(id, instancePath);

export const factoryEnsureLayers = (id: string) =>
  ipcTask("factoryEnsureLayers")(id);

export const factoryEnsureOutputDir = (id: string) =>
  ipcTask("factoryEnsureOutputDir")(id);

export const factoryGenerateMetadata = (
  id: string,
  cid: string,
  attributes: any
) => ipcTask("factoryGenerateMetadata")(id, cid, attributes);

export const factoryDeployImages = (id: string) =>
  ipcTask("factoryDeployImages")(id);

export const factoryDeployMetadata = (id: string) =>
  ipcTask("factoryDeployMetadata")(id);

export const factoryGetRandomImage = (
  id: string,
  attributes: any,
  maxSize: number
) => ipcTask("factoryGetRandomImage")(id, attributes);

export const factoryLoadSecrets = (
  id: string,
  secrets: Record<string, string>
) => ipcTask("factoryLoadSecrets")(id, secrets);

export const getContract = (name: string) => ipcTask("getContract")(name);

export const getContractSource = (name: string) =>
  ipcTask("getContractSource")(name);

export const getOutputDir = (inputDir: string) =>
  ipcTask("getOutputDir")(inputDir);

export const factoryGetTraitImage = (id: string, trait: any, maxSize: number) =>
  ipcTaskWithRequestId("factoryGetTraitImage")(id, trait, maxSize);

export const factoryRewriteImage = (id: string, i: number, dataURL: string) =>
  ipcTask("factoryRewriteImage")(id, i, dataURL);

export const factoryGetRandomTraitImage = (
  id: string,
  layersName: string[],
  maxSize: number
) =>
  ipcTaskWithRequestId("factoryGetRandomTraitImage")(id, layersName, maxSize);

export const compose = (buffers: Buffer[], configuration: any) =>
  ipcTaskWithRequestId("compose")(buffers, configuration);

export const factoryGenerateRandomAttributesFromNodes = (
  id: string,
  nodes: any[]
) => ipcTask("factoryGenerateRandomAttributesFromNodes")(id, nodes);

export const name = (inputDir: string) => ipcTask("name")(inputDir);

export const sizeOf = (inputDir: string) => ipcTask("sizeOf")(inputDir);

export const pinFileToIPFS = (
  pinataApiKey: string,
  pinataSecretApiKey: string,
  src: string
) => ipcTask("pinFileToIPFS")(pinataApiKey, pinataSecretApiKey, src);

export const verifyContract = (
  apiKey: string,
  sourceCode: string,
  network: string,
  contractaddress: string,
  codeformat: string,
  contractname: string,
  compilerversion: string,
  optimizationUsed: number
) =>
  ipcTask("verifyContract")(
    apiKey,
    sourceCode,
    network,
    contractaddress,
    codeformat,
    contractname,
    compilerversion,
    optimizationUsed
  );

export const isValidInputDir = (inputDir: string) =>
  ipcTask("isValidInputDir")(inputDir);
