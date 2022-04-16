import { ipcMain, dialog, shell } from "electron";
import path from "path";
import { Factory, getContract } from "./Factory";
import { capitalize, layersNames } from "./utils";
import fs from "fs";
import {
  setPinataApiKey,
  getPinataApiKey,
  setPinataSecretApiKey,
  getPinataSecretApiKey,
  setInfuraProjectId,
  getInfuraProjectId,
  setEtherscanApiKey,
  getEtherscanApiKey,
} from "./store";
import {
  Collection,
  CollectionItem,
  Configuration,
  Generation,
  Layer,
  MetadataItem,
  Secrets,
  Template,
  Trait,
} from "./typings";
import NodeWalletConnect from "@walletconnect/node";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { ContractFactory, providers as ethersProviders, utils } from "ethers";

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
      path.join(projectDir, ".build", "instance.json"),
      "utf8"
    )
  )
);

ipcAsyncTask("ensureProjectStructure", async (projectDir: string) => {
  const buildDir = path.join(projectDir, ".build");
  if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir);
});

ipcAsyncTask(
  "writeProjectInstance",
  async (projectDir: string, instance: any) =>
    await fs.promises.writeFile(
      path.join(projectDir, ".build", "instance.json"),
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

ipcTask("factoryLoadSecrets", (id: string, secrets: Secrets) => {
  factories[id].loadSecrets(secrets);
  return true;
});

ipcTaskWithRequestId("factoryGetLayerByName", (id: string, layerName: string) =>
  factories[id].getLayerByName(layerName)
);

ipcTaskWithRequestId(
  "factoryGetTraitsByLayerName",
  (id: string, layerName: string) =>
    factories[id].getTraitsByLayerName(layerName)
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
  "factoryUnify",
  async (id: string, name: string, generations: Generation[]) =>
    await factories[id].unify(name, generations)
);

ipcAsyncTask(
  "factoryRemove",
  async (id: string, generation: Generation) =>
    await factories[id].remove(generation)
);

// #endregion

// #region Provider
export const providers: Record<string, WalletConnectProvider> = {};

/*
-> createProvider
<- createProviderUri
<- createProviderResult (connected | error)
*/
ipcMain.on("createProvider", async (event, id: string) => {
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

  connector.on("connect", (error, payload) => {
    if (error) {
      event.reply("createProviderResult", { id, connected: false });
    } else {
      const provider = new WalletConnectProvider({
        connector,
        infuraId: getInfuraProjectId() as string,
        chainId: 4,
      });
      providers[id] = provider;

      const { accounts, chainId } = payload.params[0];

      console.log(accounts, chainId);

      event.reply("createProviderResult", { id, connected: true });
    }
  });

  await connector.createSession();
  const uri = connector.uri;
  event.reply("createProviderUri", { id, uri });
});

ipcMain.on("XXX", async (event) => {
  const connector = new NodeWalletConnect(
    {
      bridge: "https://bridge.walletconnect.org",
    },
    {
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
      event.reply("XXXResult", { error: true });
    } else {
      const provider = new WalletConnectProvider({
        connector,
        infuraId: getInfuraProjectId() as string,
        chainId: 4,
      });

      await provider.enable();

      console.log("provider");

      event.reply("XXXResult", { connected: true });

      const web3Provider = new ethersProviders.Web3Provider(provider);

      console.log("web3Provider");

      const signer = web3Provider.getSigner();

      console.log("signer");

      const { contracts } = await getContract("721");

      console.log("contracts");

      const { NFT } = contracts["721"];
      const metadata = JSON.parse(NFT.metadata);
      const { version: compilerVersion } = metadata.compiler;
      const { abi, evm } = NFT;
      const { bytecode } = evm;
      const contractFactory = new ContractFactory(abi, bytecode, signer);

      console.log("contractFactory");

      const contract = await contractFactory.deploy(
        "TEST",
        "TEST",
        "TEST",
        utils.parseEther("0.05"),
        5,
        10
      );

      console.log("contract");

      const contractAddress = contract.address;
      const transactionHash = contract.deployTransaction.hash;

      console.log({
        contractAddress,
        compilerVersion,
        transactionHash,
      });

      event.reply("XXXResult", { done: true });
    }
  });

  await connector.createSession();
  const uri = connector.uri;
  event.reply("XXXUri", { uri });
});
// #endregion
