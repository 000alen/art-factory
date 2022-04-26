import { contextBridge, ipcRenderer } from "electron";

// import { Titlebar } from "custom-electron-titlebar";

const sendWhitelist = [
  "getPinataApiKey",
  "getPinataSecretApiKey",
  "getInfuraProjectId",
  "getEtherscanApiKey",
  "setPinataApiKey",
  "setPinataSecretApiKey",
  "setInfuraProjectId",
  "setEtherscanApiKey",

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

  // "getCost",
  "getBalanceOf",
  "getTokenOfOwnerByIndex",
  "getTokenUri",
  "mint",
  "getWalletOfOwner",
  // "setCost",
  // "setMaxMintAmount",
  "withdraw",
  "pause",
  "setBaseUri",
  "reveal",

  "mintDrop",
  "sellDropBundles",
  "sellDropItems",
  "sellDrop",

  "createProvider",
  "createProviderUri",
  "createProviderResult",
  "createProviderWithKey",

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

  // "getCostResult",
  "getBalanceOfResult",
  "getTokenOfOwnerByIndexResult",
  "getTokenUriResult",
  "mintResult",
  "getWalletOfOwnerResult",
  // "setCostResult",
  // "setMaxMintAmountResult",
  "withdrawResult",
  "pauseResult",
  "setBaseUriResult",
  "revealResult",

  "mintDropResult",
  "sellDropBundlesResult",
  "sellDropItemsResult",
  "sellDropResult",

  "createProvider",
  "createProviderUri",
  "createProviderResult",
  "createProviderWithKeyResult",

  "createContractResult",
];

// window.addEventListener("DOMContentLoaded", () => {
//   new Titlebar();
// });

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
