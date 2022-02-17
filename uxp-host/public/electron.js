const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const isDevelopment = require("electron-is-dev");
const path = require("path");
const solc = require("solc");
const { Factory } = require("./art");
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

ipcMain.on("showOpenDialog", async (event, ...args) => {
  const result = await dialog.showOpenDialog(...args);
  event.reply("showOpenDialogResult", result);
});

ipcMain.on("showSaveDialog", async (event, ...args) => {
  const result = await dialog.showSaveDialog(...args);
  event.reply("showSaveDialogResult", result);
});

ipcMain.on("createFactory", (event, id, config, inputDir, outputDir) => {
  const factory = new Factory(config, inputDir, outputDir);
  factories[id] = factory;
  event.reply("createFactoryResult", id);
});

ipcMain.on("factoryMaxCombinations", (event, id) => {
  event.reply("factoryMaxCombinationsResult", factories[id].maxCombinations);
});

ipcMain.on("factoryInstance", (event, id) => {
  event.reply("factoryInstanceResult", factories[id].instance);
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

// ipcMain.on("compilerTest", (event) => {
//   const input = {
//     language: "Solidity",
//     sources: {
//       "test.sol": {
//         content: "contract C { function f() public { } }",
//       },
//     },
//     settings: {
//       outputSelection: {
//         "*": {
//           "*": ["*"],
//         },
//       },
//     },
//   };

//   const output = JSON.parse(solc.compile(JSON.stringify(input)));
//   event.reply("compilerTestResult", output);
// });

// ipcMain.on("getContract", async (event) => {
//   const contractSource = await fs.promises.readFile(
//     path.join(__dirname, "contracts", "NFT.sol"),
//     {
//       encoding: "utf8",
//     }
//   );
//   event.reply("getContractResult", contractSource);
// });
