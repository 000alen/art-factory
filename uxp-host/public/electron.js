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
    resizable: false,
    width: 800,
    height: 600,
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

// ipcMain.on("factoryTest", async (event, inputDir, outputDir) => {
//   const factory = new Factory(
//     {
//       name: "Test",
//       symbol: "TEST",
//       description: "Test",
//       width: 512,
//       height: 512,
//       generateBackground: true,
//       layers: ["Eyeball", "Eye color", "Shine", "Iris"],
//     },
//     inputDir,
//     outputDir
//   );

//   await factory.loadLayers();
//   await factory.bootstrapOutput();
//   const attributes = factory.generateRandomAttributes(10);
//   await factory.generateImages(attributes);

//   const imagesCID = await factory.deployImages();
//   await factory.generateMetadata(imagesCID, attributes);
//   const jsonCID = await factory.deployMetadata();

//   // await factory.deployContract();
//   // await factory.verifyContract();

//   event.reply("factoryTestResult", {
//     imagesCID,
//     jsonCID,
//   });
// });

ipcMain.on("createFactory", (event, id, config, inputDir, outputDir) => {
  const factory = new Factory(config, inputDir, outputDir);
  factories[id] = factory;
  event.reply("createFactoryResult", factory.id);
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
  event.reply("factoryLoadLayersResult", factory.id);
});

ipcMain.on("factoryBootstrapOutput", async (event, id) => {
  const factory = factories[id];
  await factory.bootstrapOutput();
  event.reply("factoryBootstrapOutputResult", factory.id);
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
  await factory.generateImages(attributes);
  event.reply("factoryGenerateImagesResult", factory.id);
});

ipcMain.on("factoryGenerateMetadata", async (event, id, cid, attributes) => {
  const factory = factories[id];
  await factory.generateMetadata(cid, attributes);
  event.reply("factoryGenerateMetadataResult", factory.id);
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

ipcMain.on("compilerTest", (event) => {
  const input = {
    language: "Solidity",
    sources: {
      "test.sol": {
        content: "contract C { function f() public { } }",
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
  event.reply("compilerTestResult", output);
});

ipcMain.on("getContract", async (event) => {
  const contractSource = await fs.promises.readFile(
    path.join(__dirname, "contracts", "NFT.sol"),
    {
      encoding: "utf8",
    }
  );
  event.reply("getContractResult", contractSource);
});
