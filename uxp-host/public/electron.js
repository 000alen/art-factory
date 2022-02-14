const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const isDevelopment = require("electron-is-dev");
const path = require("path");
const { Factory } = require("./art");

require("./server.js");

const createWindow = () => {
  const window = new BrowserWindow({
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

ipcMain.on("factoryTest", async (event, inputDir, outputDir) => {
  const factory = new Factory(
    {
      name: "Test",
      symbol: "TEST",
      description: "Test",
      width: 512,
      height: 512,
      generateBackground: true,
      layers: ["Eyeball", "Eye color", "Shine", "Iris"],
    },
    inputDir,
    outputDir
  );

  await factory.loadLayers();
  await factory.bootstrapOutput();
  const attributes = factory.generateRandomAttributes(10);
  await factory.generateImages(attributes);

  factory.ensurePinata();
  factory.pinata
    .testAuthentication()
    .then((result) => {
      console.log(result);
    })
    .catch((error) => {
      console.log(error);
    });

  // const imagesCID = await factory.deployImages();
  // await factory.generateMetadata(imagesCID, attributes);
  // await factory.deployMetadata();
  // await factory.deployContract();
  // await factory.verifyContract();

  event.reply("factoryTestResult", true);
});
