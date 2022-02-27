const { ipcMain, dialog } = require("electron");
const path = require("path");
const solc = require("solc");
const { Factory, loadInstance, layersNames, compose } = require("./art");
const fs = require("fs");
const {
  setPinataApiKey,
  getPinataApiKey,
  setPinataSecretApiKey,
  getPinataSecretApiKey,
  setInfuraId,
  getInfuraId,
} = require("./store");

const ipcTask = (task, callback) => {
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

const ipcAsyncTask = (task, callback) => {
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

const ipcTaskWithProgress = (task, callback) => {
  ipcMain.on(task, async (event, id, ...args) => {
    let error = null;
    let result = null;
    try {
      result = await callback(
        (i) => {
          event.reply(`${task}Progress`, { id, i });
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

const ipcTaskWithRequestId = (task, callback) => {
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

const capitalize = (string) => string.charAt(0).toUpperCase() + string.slice(1);

const ipcSetterAndGetter = (property, setter, getter) => {
  ipcAsyncTask(
    `set${capitalize(property)}`,
    async (value) => await setter(value)
  );
  ipcAsyncTask(`get${capitalize(property)}`, async () => await getter());
};

const factories = {};

ipcTaskWithRequestId("factoryGetImage", async (id, index) =>
  factories[id].getImage(index)
);

ipcTaskWithProgress(
  "factoryGenerateImages",
  async (onProgress, id, attributes) =>
    await factories[id].generateImages(attributes, onProgress)
);

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

ipcTask("createFactory", (id, configuration, inputDir, outputDir, props) => {
  const factory = new Factory(configuration, inputDir, outputDir);
  if (props) factory.setProps(props);
  factories[id] = factory;
  return true;
});

ipcTask("factorySetProps", (id, props) => {
  factories[id].setProps(props);
  return true;
});

ipcTask("factoryMaxCombinations", (id) => factories[id].maxCombinations);

ipcTask("layersNames", (inputDir) => layersNames(inputDir));

ipcTask("factoryInstance", (id) => factories[id].instance);

ipcTask("factoryLoadSecrets", (id, secrets) => {
  factories[id].loadSecrets(secrets);
  return true;
});

ipcAsyncTask(
  "factorySaveInstance",
  async (id) => await factories[id].saveInstance()
);

ipcAsyncTask("factoryLoadInstance", async (id, instancePath) => {
  factories[id] = await loadInstance(instancePath);
  return true;
});

ipcAsyncTask("factoryEnsureLayers", async (id) => {
  const factory = factories[id];
  await factory.ensureLayers();
  return true;
});

ipcAsyncTask("factoryEnsureOutputDir", async (id) => {
  const factory = factories[id];
  await factory.ensureOutputDir();
  return true;
});

ipcTask("factoryGenerateRandomAttributes", (id, n) =>
  factories[id].generateRandomAttributes(n)
);

ipcTask("factoryGenerateAttributes", (id) =>
  factories[id].generateAttributes()
);

ipcAsyncTask("factoryGenerateMetadata", async (id, cid, attributes) => {
  await factories[id].generateMetadata(cid, attributes);
  return true;
});

ipcAsyncTask(
  "factoryDeployImages",
  async (id) => await factories[id].deployImages()
);

ipcAsyncTask(
  "factoryDeployMetadata",
  async (id) => await factories[id].deployMetadata()
);

ipcTask("factoryGetRandomImage", (id, attributes) =>
  factories[id].getRandomImage(attributes)
);

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

ipcTask("getOutputDir", (inputDir) =>
  path.join(path.dirname(inputDir), `${path.basename(inputDir)}_build`)
);

ipcSetterAndGetter("pinataApiKey", setPinataApiKey, getPinataApiKey);

ipcSetterAndGetter(
  "pinataSecretApiKey",
  setPinataSecretApiKey,
  getPinataSecretApiKey
);

ipcSetterAndGetter("infuraId", setInfuraId, getInfuraId);

ipcTaskWithRequestId(
  "factoryGetRandomTraitImage",
  async (id, layerName) => await factories[id].getRandomTraitImage(layerName)
);

ipcTaskWithRequestId(
  "factoryGetTraitImage",
  async (id, trait) => await factories[id].getTraitImage(trait)
);

ipcAsyncTask("factoryRewriteImage", async (id, i, dataUrl) => {
  await factories[id].rewriteImage(i, dataUrl);
  return true;
});

ipcTaskWithRequestId(
  "compose",
  async (...buffers) => await compose(...buffers)
);

ipcTask("factoryGenerateRandomAttributesFromNodes", (id, nodes) => {
  return factories[id].generateRandomAttributesFromNodes(nodes);
  // return factories[id].probSolution(nodes);
});
