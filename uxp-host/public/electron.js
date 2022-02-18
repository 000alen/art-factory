const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const isDevelopment = require("electron-is-dev");
const path = require("path");
const solc = require("solc");
const { Factory, loadInstance } = require("./art");
const fs = require("fs");

require("./server.js");

const factories = {};

const createWindow = () => {
  const window = new BrowserWindow({
    autoHideMenuBar: true,
    minWidth: 1024,
    minHeight: 768,
    width: 1024,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // Configure electron development environment
  window.loadURL(
    isDevelopment
      ? "http://localhost:3000"
      : `file://${path.join(__dirname, "../build/index.html")}`
  );

  if (isDevelopment) {
    window.webContents.openDevTools({
      mode: "detach",
    });
  }
};

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.on("mkDir", async (event, ...args) => {
  await fs.promises.mkdir(...args);
  event.send("mkDirResult", true);
});

ipcMain.on("showOpenDialog", async (event, ...args) => {
  const result = await dialog.showOpenDialog(...args);
  event.reply("showOpenDialogResult", result);
});

ipcMain.on("showSaveDialog", async (event, ...args) => {
  const result = await dialog.showSaveDialog(...args);
  event.reply("showSaveDialogResult", result);
});

ipcMain.on("createFactory", (event, id, config, inputDir, outputDir, props) => {
  const factory = new Factory(config, inputDir, outputDir);
  if (props) {
    const {
      n,
      attributes,
      generated,
      metadataGenerated,
      imagesCID,
      metadataCID,
      contractAddress,
    } = props;
    factory.n = n;
    factory.attributes = attributes;
    factory.generated = generated;
    factory.metadataGenerated = metadataGenerated;
    factory.imagesCID = imagesCID;
    factory.metadataCID = metadataCID;
    factory.contractAddress = contractAddress;
  }

  factories[id] = factory;
  event.reply("createFactoryResult", id);
});

ipcMain.on("factoryMaxCombinations", (event, id) => {
  event.reply("factoryMaxCombinationsResult", factories[id].maxCombinations);
});

ipcMain.on("factoryInstance", (event, id) => {
  event.reply("factoryInstanceResult", factories[id].instance);
});

ipcMain.on("factorySaveInstance", async (event, id) => {
  const factory = factories[id];
  const instancePath = await factory.saveInstance();
  event.reply("factorySaveInstanceResult", instancePath);
});

ipcMain.on("factoryLoadInstance", async (event, id, instancePath) => {
  const factory = await loadInstance(instancePath);
  factories[id] = factory;
  event.reply("factoryLoadInstanceResult", id);
});

ipcMain.on("factoryLoadLayers", async (event, id) => {
  const factory = factories[id];
  await factory.loadLayers();
  event.reply("factoryLoadLayersResult", id);
});

ipcMain.on("factoryBootstrapOutput", async (event, id) => {
  const factory = factories[id];
  await factory.bootstrapOutput();
  event.reply("factoryBootstrapOutputResult", id);
});

ipcMain.on("factoryGenerateRandomAttributes", (event, id, n) => {
  const factory = factories[id];
  const attributes = factory.generateRandomAttributes(n);
  event.reply("factoryGenerateRandomAttributesResult", attributes);
});

ipcMain.on("factoryGenerateAllAttributes", (event, id) => {
  const factory = factories[id];
  const attributes = factory.generateAllAttributes();
  event.reply("factoryGenerateAllAttributesResult", attributes);
});

ipcMain.on("factoryGenerateImages", async (event, id, attributes) => {
  const factory = factories[id];
  await factory.generateImages(attributes, (i) => {
    event.reply("factoryGenerateImagesProgress", { id, i });
  });
  event.reply("factoryGenerateImagesResult", id);
});

ipcMain.on("factoryGenerateMetadata", async (event, id, cid, attributes) => {
  const factory = factories[id];
  await factory.generateMetadata(cid, attributes);
  event.reply("factoryGenerateMetadataResult", id);
});

ipcMain.on("factoryDeployImages", async (event, id) => {
  const factory = factories[id];
  const cid = await factory.deployImages();
  event.reply("factoryDeployImagesResult", cid);
});

ipcMain.on("factoryDeployMetadata", async (event, id) => {
  const factory = factories[id];
  const cid = await factory.deployMetadata();
  event.reply("factoryDeployMetadataResult", cid);
});

ipcMain.on("factoryGetRandomGeneratedImage", async (event, id, attributes) => {
  const factory = factories[id];
  const image = factory.getRandomGeneratedImage(attributes);
  event.reply("factoryGetRandomGeneratedImageResult", image);
});

ipcMain.on("factoryGetImage", async (event, id, requestId, index) => {
  const factory = factories[id];
  const image = factory.getImage(index);
  event.reply("factoryGetImageResult", requestId, image);
});

ipcMain.on("getContract", async (event, name) => {
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

  const output = JSON.parse(solc.compile(JSON.stringify(input)));
  event.reply("getContractResult", output);
});

ipcMain.on("getOutputDir", (event, inputDir) => {
  const outputDir = path.join(
    path.dirname(inputDir),
    `${path.basename(inputDir)}_build`
  );
  event.reply("getOutputDirResult", outputDir);
});
