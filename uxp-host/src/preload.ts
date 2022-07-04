import { contextBridge, ipcRenderer } from "electron";

const sendWhitelist = [
  "getPinataApiKey",
  "getPinataSecretApiKey",
  "getInfuraProjectId",
  "getEtherscanApiKey",
  "getOpenseaApiKey",
  "setPinataApiKey",
  "setPinataSecretApiKey",
  "setInfuraProjectId",
  "setEtherscanApiKey",
  "setOpenseaApiKey",
  "setMaticVigilApiKey",
  "getMaticVigilApiKey",

  "showOpenDialog",
  "openInExplorer",

  "readProjectInstance",
  "ensureProjectStructure",
  "writeProjectInstance",
  "readProjectAvailableLayers",
  "hasFactory",
  "createFactory",
  "factoryReloadConfiguration",
  "factoryReloadLayers",
  "factoryLoadSecrets",
  "factoryGetLayerByName",
  "factoryGetTraitsByLayerName",
  "factoryMakeGeneration",
  "factoryComputeMaxCombinations",
  "factoryComposeTraits",
  "factoryGenerateImages",
  "factoryGenerateMetadata",
  "factoryDeploy",
  "factoryGetTraitImage",
  "factoryGetRandomTraitImage",
  "factoryGetImage",
  "factoryGetRandomImage",
  "factoryRemoveItems",
  "factoryRegenerateItems",
  "factoryReplaceItems",
  "factoryUnify",
  "factoryRemove",
  "factoryReconstruct",
  "factoryGetResolution",
  "factoryHydrateMetadata",

  "getBalanceOf",
  "getTokenOfOwnerByIndex",
  "getTokenUri",
  "mint",
  "getWalletOfOwner",
  "withdraw",
  "pause",
  "setBaseUri",
  "reveal",

  "mintDrop",
  "sellDropBundles",
  "sellDropItems",
  "sellDrop",

  // "createProvider",
  // "createProviderUri",
  // "createProviderResult",
  // "createProviderWithKey",

  "createSigner",
  "createContract",
];

const onWhitelist = [
  "getPinataApiKeyResult",
  "getPinataSecretApiKeyResult",
  "getInfuraProjectIdResult",
  "getEtherscanApiKeyResult",
  "setPinataApiKeyResult",
  "setPinataSecretApiKeyResult",
  "setInfuraProjectIdResult",
  "setEtherscanApiKeyResult",
  "setOpenseaApiKeyResult",
  "getOpenseaApiKeyResult",
  "setMaticVigilApiKeyResult",
  "getMaticVigilApiKeyResult",

  "showOpenDialogResult",
  "openInExplorerResult",

  "readProjectInstanceResult",
  "ensureProjectStructureResult",
  "writeProjectInstanceResult",
  "readProjectAvailableLayersResult",
  "hasFactoryResult",
  "createFactoryResult",
  "factoryReloadConfigurationResult",
  "factoryReloadLayersResult",
  "factoryLoadSecretsResult",
  "factoryGetLayerByNameResult",
  "factoryGetTraitsByLayerNameResult",
  "factoryMakeGenerationResult",
  "factoryComputeMaxCombinationsResult",
  "factoryComposeTraitsResult",
  "factoryGenerateImagesProgress",
  "factoryGenerateImagesResult",
  "factoryGenerateMetadataProgress",
  "factoryGenerateMetadataResult",
  "factoryDeployResult",
  "factoryGetTraitImageResult",
  "factoryGetRandomTraitImageResult",
  "factoryGetImageResult",
  "factoryGetRandomImageResult",
  "factoryRemoveItemsResult",
  "factoryRegenerateItemsResult",
  "factoryReplaceItemsResult",
  "factoryUnifyResult",
  "factoryRemoveResult",
  "factoryReconstructResult",
  "factoryGetResolutionResult",
  "factoryHydrateMetadataResult",

  "getBalanceOfResult",
  "getTokenOfOwnerByIndexResult",
  "getTokenUriResult",
  "mintResult",
  "getWalletOfOwnerResult",
  "withdrawResult",
  "pauseResult",
  "setBaseUriResult",
  "revealResult",

  "mintDropResult",
  "sellDropBundlesResult",
  "sellDropItemsResult",
  "sellDropResult",

  // "createProvider",
  // "createProviderUri",
  // "createProviderResult",
  // "createProviderWithKeyResult",

  "createSignerResult",
  "createContractResult",
];

contextBridge.exposeInMainWorld("ipcRenderer", {
  send: (channel: string, ...args: any[]) => {
    if (sendWhitelist.includes(channel)) {
      return ipcRenderer.send(channel, ...(args === undefined ? [] : args));
    } else {
      throw new Error(`${channel} is not on the whitelist`);
    }
  },
  on: (channel: string, listener: (...args: any[]) => void) => {
    if (onWhitelist.includes(channel)) {
      return ipcRenderer.on(channel, (event, ...args) =>
        listener(...(args === undefined ? [] : args))
      );
    } else {
      throw new Error(`${channel} is not on the whitelist`);
    }
  },
  once: (channel: string, listener: (...args: any[]) => void) => {
    if (onWhitelist.includes(channel)) {
      return ipcRenderer.once(channel, (event, ...args) =>
        listener(...(args === undefined ? [] : args))
      );
    } else {
      throw new Error(`${channel} is not on the whitelist`);
    }
  },
  removeListener: (channel: string, listener: (...args: any[]) => void) => {
    if (onWhitelist.includes(channel)) {
      return ipcRenderer.removeListener(channel, listener);
    } else {
      throw new Error(`${channel} is not on the whitelist`);
    }
  },
});
