import { ipcMain, dialog, shell } from "electron";
import path from "path";
import solc from "solc";
import { Factory } from "./Factory";
import { capitalize, layersNames, name, sizeOf } from "./utils";
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
  Instance,
  Layer,
  Secrets,
  Trait,
} from "./typings";

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

const factories: Record<string, Factory> = {};

// #region General
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

ipcAsyncTask("writeFile", async (file, data, options) => {
  await fs.promises.writeFile(file, data, options);
  return true;
});

ipcAsyncTask("mkDir", async (path, options) => {
  await fs.promises.mkdir(path, options);
  return true;
});

ipcAsyncTask(
  "showOpenDialog",
  async (options) => await dialog.showOpenDialog(options)
);

ipcAsyncTask(
  "showSaveDialog",
  async (options) => await dialog.showSaveDialog(options)
);

ipcTask("name", (inputDir) => name(inputDir));

ipcTask("sizeOf", (inputDir) => sizeOf(inputDir));

ipcAsyncTask("isValidInputDir", async (inputDir: string) => {
  const layersNames = (await fs.promises.readdir(inputDir)).filter(
    (file) => !file.startsWith(".")
  );

  if (layersNames.length === 0) return false;

  for (const layerName of layersNames) {
    const layerPath = path.join(inputDir, layerName);
    const isDir = (await fs.promises.lstat(layerPath)).isDirectory();
    if (!isDir) return false;
    const layerElements = (await fs.promises.readdir(layerPath)).filter(
      (file) => !file.startsWith(".")
    );
    for (const layerElement of layerElements) {
      const elementPath = path.join(layerPath, layerElement);
      const isFile = (await fs.promises.lstat(elementPath)).isFile();
      if (!isFile) return false;
      const ext = path.parse(elementPath).ext;
      if (ext !== ".png" && ext !== ".gif") return false;
    }
  }
  return true;
});

ipcAsyncTask("getContract", async (name) => {
  const content = await fs.promises.readFile(
    path.join(__dirname, "contracts", `${name}.sol`),
    {
      encoding: "utf8",
    }
  );

  const input = {
    language: "Solidity",
    sources: {
      [name]: {
        content,
      },
    },
    settings: {
      outputSelection: {
        "*": {
          "*": ["*"],
        },
      },
    },
  };

  return JSON.parse(solc.compile(JSON.stringify(input)));
});

ipcTask("openFolder", (path: string) => shell.openPath(path));

ipcAsyncTask(
  "getContractSource",
  async (name) =>
    await fs.promises.readFile(
      path.join(__dirname, "contracts", `${name}.sol`),
      {
        encoding: "utf8",
      }
    )
);

ipcTask("getOutputDir", (inputDir) => path.join(inputDir, ".build"));

ipcSetterAndGetter("pinataApiKey", setPinataApiKey, getPinataApiKey);

ipcSetterAndGetter(
  "pinataSecretApiKey",
  setPinataSecretApiKey,
  getPinataSecretApiKey
);

ipcSetterAndGetter("infuraProjectId", setInfuraProjectId, getInfuraProjectId);

ipcSetterAndGetter("etherscanApiKey", setEtherscanApiKey, getEtherscanApiKey);
// #endregion

// #region Factory
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
  "factoryGenerateCollection",
  (
    id: string,
    keys: string[],
    nTraits: Trait[][],
    ns: Record<string, number>,
    nBundles: { name: string; ids: string[] }[]
  ) => factories[id].generateCollection(keys, nTraits, ns, nBundles)
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
    name: string,
    collection: Collection
  ) => {
    await factories[id].generateImages(name, collection, onProgress);
    return true;
  }
);

ipcTaskWithProgress(
  "factoryGenerateMetadata",
  async (
    onProgress: (name: string) => void,
    id: string,
    name: string,
    collection: Collection
  ) => {
    await factories[id].generateMetadata(name, collection, onProgress);
    return true;
  }
);

ipcAsyncTask(
  "factoryDeployImages",
  async (id: string) => await factories[id].deployImages()
);

ipcAsyncTask(
  "factoryDeployMetadata",
  async (id: string) => await factories[id].deployMetadata()
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
    name: string,
    collectionItem: CollectionItem,
    maxSize?: number
  ) => {
    const buffer = await factories[id].getImage(name, collectionItem, maxSize);
    return buffer.toString("base64");
  }
);

ipcAsyncTask(
  "factoryGetRandomImage",
  async (
    id: string,
    name: string,
    collection: Collection,
    maxSize?: number
  ) => {
    const [collectionItem, buffer] = await factories[id].getRandomImage(
      name,
      collection,
      maxSize
    );
    return [collectionItem, buffer.toString("base64")];
  }
);

ipcAsyncTask(
  "factoryRewriteImage",
  async (id: string, collectionItem: CollectionItem, dataUrl: string) => {
    await factories[id].rewriteImage(collectionItem, dataUrl);
    return true;
  }
);

ipcAsyncTask(
  "factoryRemoveCollectionItems",
  async (
    id: string,
    name: string,
    collection: Collection,
    collectionItems: Collection
  ) =>
    await factories[id].removeCollectionItems(name, collection, collectionItems)
);

ipcAsyncTask(
  "factoryRegenerateCollectionItems",
  async (
    id: string,
    name: string,
    collection: Collection,
    collectionItems: Collection
  ) =>
    await factories[id].regenerateCollectionItems(
      name,
      collection,
      collectionItems
    )
);

ipcAsyncTask(
  "factoryGenerateNotRevealedImage",
  async (id: string, traits: Trait[]) =>
    await factories[id].generateNotRevealedImage(traits)
);

ipcAsyncTask(
  "factoryGenerateNotRevealedMetadata",
  async (id: string) => await factories[id].generateNotRevealedMetadata()
);

ipcAsyncTask(
  "factoryDeployNotRevealedImage",
  async (id: string) => await factories[id].deployNotRevealedImage()
);

ipcAsyncTask(
  "factoryDeployNotRevealedMetadata",
  async (id: string) => await factories[id].deployNotRevealedMetadata()
);

// #endregion
