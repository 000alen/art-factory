import { dialog, ipcMain, shell } from "electron";
import { Contract, providers as ethersProviders } from "ethers";
import fs from "fs";
import path from "path";
import Web3ProviderEngine from "web3-provider-engine";
import RPCSubprovider from "web3-provider-engine/subproviders/rpc";

import { PrivateKeyWalletSubprovider } from "@0x/subproviders";
import NodeWalletConnect from "@walletconnect/node";
import WalletConnectProvider from "@walletconnect/web3-provider";

import { BUILD_DIR_NAME, ChainId } from "./constants";
import { Factory } from "./Factory";
import {
  getEtherscanApiKey,
  getInfuraProjectId,
  getOpenseaApiKey,
  getPinataApiKey,
  getPinataSecretApiKey,
  setEtherscanApiKey,
  setInfuraProjectId,
  setOpenseaApiKey,
  setPinataApiKey,
  setPinataSecretApiKey,
} from "./store";
import {
  Collection,
  CollectionItem,
  Configuration,
  Deployment,
  Drop,
  Generation,
  Layer,
  MetadataItem,
  Network,
  Template,
  Trait,
} from "./typings";
import { capitalize, getInfuraEndpoint, layersNames } from "./utils";
import { Eth } from "web3-eth";
import { OpenSeaPort, Network as OpenSeaNetwork } from "./opensea";

// #region Helpers
const ipcTask = (task: string, callback: (...args: any[]) => any) => {
  ipcMain.on(task, (event, ...args) => {
    let error = null;
    let result = null;
    try {
      result = callback(...args);
    } catch (_error) {
      error = _error;
    } finally {
      event.reply(`${task}Result`, { error, result });
    }
  });
};

const ipcAsyncTask = (task: string, callback: (...args: any[]) => any) => {
  ipcMain.on(task, async (event, ...args) => {
    let error = null;
    let result = null;
    try {
      result = await callback(...args);
    } catch (_error) {
      error = _error;
    } finally {
      event.reply(`${task}Result`, { error, result });
    }
  });
};

const ipcTaskWithProgress = (
  task: string,
  callback: ((...args: any[]) => any) | undefined
) => {
  ipcMain.on(task, async (event, id, ...args) => {
    let error = null;
    let result = null;
    try {
      result = await callback(
        (...progressArgs: any[]) => {
          event.reply(`${task}Progress`, { id, args: progressArgs });
        },
        id,
        ...args
      );
    } catch (_error) {
      error = _error;
    } finally {
      event.reply(`${task}Result`, { error, result });
    }
  });
};

const ipcTaskWithRequestId = (
  task: string,
  callback: (...args: any[]) => any
) => {
  ipcMain.on(task, async (event, requestId, ...args) => {
    let error = null;
    let result = null;
    try {
      result = await callback(...args);
    } catch (_error) {
      error = _error;
    } finally {
      event.reply(`${task}Result`, { requestId, error, result });
    }
  });
};

const ipcSetterAndGetter = (
  property: string,
  setter: (value: any) => void,
  getter: () => any
) => {
  ipcAsyncTask(
    `set${capitalize(property)}`,
    async (value) => await setter(value)
  );
  ipcAsyncTask(`get${capitalize(property)}`, async () => await getter());
};
// #endregion

// #region Property
ipcSetterAndGetter("pinataApiKey", setPinataApiKey, getPinataApiKey);

ipcSetterAndGetter(
  "pinataSecretApiKey",
  setPinataSecretApiKey,
  getPinataSecretApiKey
);

ipcSetterAndGetter("infuraProjectId", setInfuraProjectId, getInfuraProjectId);

ipcSetterAndGetter("etherscanApiKey", setEtherscanApiKey, getEtherscanApiKey);

ipcSetterAndGetter("openseaApiKey", setOpenseaApiKey, getOpenseaApiKey);
// #endregion

// #region General
ipcAsyncTask(
  "showOpenDialog",
  async (options) => await dialog.showOpenDialog(options)
);

ipcTask("openInExplorer", (paths: string[]) =>
  shell.openPath(path.join(...paths))
);
// #endregion

// #region Factory
export const factories: Record<string, Factory> = {};

ipcAsyncTask("readProjectInstance", async (projectDir: string) =>
  JSON.parse(
    await fs.promises.readFile(
      path.join(projectDir, BUILD_DIR_NAME, "instance.json"),
      "utf8"
    )
  )
);

ipcAsyncTask("ensureProjectStructure", async (projectDir: string) => {
  const buildDir = path.join(projectDir, BUILD_DIR_NAME);
  if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir);
});

ipcAsyncTask(
  "writeProjectInstance",
  async (projectDir: string, instance: any) =>
    await fs.promises.writeFile(
      path.join(projectDir, BUILD_DIR_NAME, "instance.json"),
      JSON.stringify(instance)
    )
);

ipcTask("readProjectAvailableLayers", (projectDir: string) =>
  layersNames(projectDir)
);

ipcTask("hasFactory", (id: string) => id in factories);

ipcTask(
  "createFactory",
  (id: string, configuration: Configuration, projectDir: string) => {
    const factory = new Factory(configuration, projectDir);
    factories[id] = factory;
    return true;
  }
);

ipcTask(
  "factoryReloadConfiguration",
  (id: string, configuration: Configuration) =>
    factories[id].reloadConfiguration(configuration)
);

ipcAsyncTask(
  "factoryReloadLayers",
  async (id: string) => await factories[id].reloadLayers()
);

ipcTaskWithRequestId("factoryGetLayerByName", (id: string, layerName: string) =>
  factories[id].getLayerByName(layerName)
);

ipcTaskWithRequestId(
  "factoryGetTraitsByLayerName",
  (id: string, layerName: string) =>
    factories[id].getTraitsByLayerName(layerName)
);

ipcAsyncTask(
  "factoryGetResolution",
  async (id: string) => await factories[id].getResolution()
);

ipcTask(
  "factoryMakeGeneration",
  (id: string, name: string, template: Template) =>
    factories[id].makeGeneration(name, template)
);

ipcTaskWithRequestId(
  "factoryComputeMaxCombinations",
  (id: string, layers: Layer[]) => factories[id].computeMaxCombinations(layers)
);

ipcTaskWithRequestId(
  "factoryComposeTraits",
  async (id: string, traits: Trait[], maxSize?: number) => {
    const buffer = await factories[id].composeTraits(traits, maxSize);
    return buffer.toString("base64");
  }
);

ipcTaskWithProgress(
  "factoryGenerateImages",
  async (
    onProgress: (name: string) => void,
    id: string,
    generation: Generation
  ) => {
    await factories[id].generateImages(generation, onProgress);
    return true;
  }
);

ipcTaskWithProgress(
  "factoryGenerateMetadata",
  async (
    onProgress: (name: string) => void,
    id: string,
    generation: Generation,
    items: MetadataItem[]
  ) => {
    await factories[id].generateMetadata(generation, items, onProgress);
    return true;
  }
);

ipcAsyncTask(
  "factoryDeploy",
  async (
    id: string,
    providerId: string,
    generation: Generation,
    notRevealedGeneration: Generation
  ) => {
    const factory = factories[id];
    factory.loadSecrets({
      pinataApiKey: getPinataApiKey() as string,
      pinataSecretApiKey: getPinataSecretApiKey() as string,
      infuraProjectId: getInfuraProjectId() as string,
      etherscanApiKey: getEtherscanApiKey() as string,
    });
    return await factory.deploy(providerId, generation, notRevealedGeneration);
  }
);

ipcTaskWithRequestId(
  "factoryGetTraitImage",
  async (id: string, trait: Trait, maxSize?: number) => {
    const buffer = await factories[id].getTraitImage(trait, maxSize);
    return buffer.toString("base64");
  }
);

ipcTaskWithRequestId(
  "factoryGetRandomTraitImage",
  async (id: string, layer: Layer, maxSize?: number) => {
    const [trait, buffer] = await factories[id].getRandomTraitImage(
      layer,
      maxSize
    );
    return [trait, buffer.toString("base64")];
  }
);

ipcTaskWithRequestId(
  "factoryGetImage",
  async (
    id: string,
    generation: Generation,
    item: CollectionItem,
    maxSize?: number
  ) => {
    const buffer = await factories[id].getImage(generation, item, maxSize);
    return buffer.toString("base64");
  }
);

ipcAsyncTask(
  "factoryGetRandomImage",
  async (id: string, generation: Generation, maxSize?: number) => {
    const [collectionItem, buffer] = await factories[id].getRandomImage(
      generation,
      maxSize
    );
    return [collectionItem, buffer.toString("base64")];
  }
);

ipcAsyncTask(
  "factoryRemoveItems",
  async (id: string, generation: Generation, items: Collection) =>
    await factories[id].removeItems(generation, items)
);

ipcAsyncTask(
  "factoryRegenerateItems",
  async (id: string, generation: Generation, items: Collection) =>
    await factories[id].regenerateItems(generation, items)
);

ipcAsyncTask(
  "factoryReplaceItems",
  async (id: string, generation: Generation, _with: Collection) =>
    await factories[id].replaceItems(generation, _with)
);

ipcAsyncTask(
  "factoryUnify",
  async (id: string, name: string, generations: Generation[]) =>
    await factories[id].unify(name, generations)
);

ipcAsyncTask(
  "factoryRemove",
  async (id: string, generation: Generation) =>
    await factories[id].remove(generation)
);

ipcAsyncTask(
  "factoryReconstruct",
  async (id: string, generation: Generation) =>
    await factories[id].reconstruct(generation)
);

ipcAsyncTask(
  "getBalanceOf",
  async (id: string, contractId: string, address: string) =>
    await factories[id].getBalanceOf(contractId, address)
);

ipcAsyncTask(
  "getTokenOfOwnerByIndex",
  async (id: string, contractId: string, address: string, index: number) =>
    await factories[id].getTokenOfOwnerByIndex(contractId, address, index)
);

ipcAsyncTask(
  "getTokenUri",
  async (id: string, contractId: string, index: number) =>
    await factories[id].getTokenUri(contractId, index)
);

ipcAsyncTask(
  "mint",
  async (id: string, contractId: string, payable: string, mint: number) =>
    await factories[id].mint(contractId, payable, mint)
);

ipcAsyncTask(
  "getWalletOfOwner",
  async (id: string, contractId: string, owner: string) =>
    await factories[id].getWalletOfOwner(contractId, owner)
);

// ipcAsyncTask(
//   "setCost",
//   async (id: string, contractId: string, cost: string) =>
//     await factories[id].setCost(contractId, cost)
// );

// ipcAsyncTask(
//   "setMaxMintAmount",
//   async (id: string, contractId: string, amount: number) =>
//     await factories[id].setMaxMintAmount(contractId, amount)
// );

ipcAsyncTask(
  "withdraw",
  async (id: string, contractId: string) =>
    await factories[id].withdraw(contractId)
);

ipcAsyncTask(
  "pause",
  async (id: string, contractId: string) =>
    await factories[id].pause(contractId)
);

ipcAsyncTask(
  "setBaseUri",
  async (id: string, contractId: string, baseUri: string) =>
    await factories[id].setBaseUri(contractId, baseUri)
);

ipcAsyncTask(
  "reveal",
  async (id: string, contractId: string) =>
    await factories[id].reveal(contractId)
);

ipcAsyncTask(
  "mintDrop",
  async (id: string, providerId: string, contractId: string, drop: Drop) =>
    await factories[id].mintDrop(providerId, contractId, drop)
);

ipcAsyncTask(
  "sellDropBundles",
  async (
    id: string,
    providerEngineId: string,
    deployment: Deployment,
    drop: Drop
  ) => await factories[id].sellDropBundles(providerEngineId, deployment, drop)
);

ipcAsyncTask(
  "sellDropItems",
  async (
    id: string,
    providerEngineId: string,
    deployment: Deployment,
    drop: Drop
  ) => await factories[id].sellDropItems(providerEngineId, deployment, drop)
);

ipcAsyncTask(
  "sellDrop",
  async (
    id: string,
    providerEngineId: string,
    deployment: Deployment,
    drop: Drop
  ) => await factories[id].sellDrop(providerEngineId, deployment, drop)
);

// #endregion

// #region Provider
export const providers: Record<string, WalletConnectProvider> = {};
export const providerEngines: Record<string, any> = {};
export const accounts: Record<string, string> = {};
export const eths: Record<string, Eth> = {};
export const seaports: Record<string, OpenSeaPort> = {};

/*
-> createProvider
<- createProviderUri
<- createProviderResult (connected | error)
*/
ipcMain.on("createProvider", async (event, id: string, network: Network) => {
  const connector = new NodeWalletConnect(
    {
      bridge: "https://bridge.walletconnect.org",
    },
    {
      // ! TODO
      clientMeta: {
        name: "Art Factory",
        description: "Art Factory",
        url: "https://nodejs.org/en/",
        icons: ["https://nodejs.org/static/images/logo.svg"],
      },
    }
  );

  connector.on("connect", async (error, payload) => {
    if (error) {
      event.reply("createProviderResult", { id, connected: false });
    } else {
      const provider = new WalletConnectProvider({
        connector,
        infuraId: getInfuraProjectId() as string,
        chainId: ChainId[network],
      });
      await provider.enable();

      const { accounts: _accounts } = payload.params[0];

      const web3Provider = new ethersProviders.Web3Provider(provider);

      providers[id] = provider;
      accounts[id] = _accounts[0];
      // @ts-ignore
      eths[id] = new Eth(web3Provider);

      event.reply("createProviderResult", { id, connected: true });
    }
  });

  await connector.createSession();
  const uri = connector.uri;
  event.reply("createProviderUri", { id, uri });
});

ipcAsyncTask(
  "createProviderWithKey",
  async (id: string, privateKey: string, network: Network) => {
    const privateKeyWalletSubprovider = new PrivateKeyWalletSubprovider(
      privateKey,
      ChainId[network]
    );

    const infuraRpcSubprovider = new RPCSubprovider({
      rpcUrl: getInfuraEndpoint(network),
    });

    const providerEngine = new Web3ProviderEngine();
    providerEngine.addProvider(privateKeyWalletSubprovider);
    providerEngine.addProvider(infuraRpcSubprovider);
    providerEngine.start();

    const openseaApiKey = getOpenseaApiKey();

    providerEngines[id] = providerEngine;
    accounts[id] = (await privateKeyWalletSubprovider.getAccountsAsync())[0];
    eths[id] = new Eth(providerEngine);
    seaports[id] = new OpenSeaPort(providerEngine, {
      networkName:
        network === "main" ? OpenSeaNetwork.Main : OpenSeaNetwork.Rinkeby,
      ...(openseaApiKey && { apiKey: openseaApiKey as string }),
    });
  }
);

// #endregion

// #region Contract
export const contracts: Record<string, Contract> = {};

ipcAsyncTask(
  "createContract",
  async (id: string, providerId: string, contractAddress: string, abi: any) => {
    const web3Provider = new ethersProviders.Web3Provider(
      providers[providerId]
    );
    const signer = web3Provider.getSigner();
    const contract = new Contract(contractAddress, abi, signer);
    contracts[id] = contract;
  }
);
// #endregion
