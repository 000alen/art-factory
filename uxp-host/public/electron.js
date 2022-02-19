const { app, BrowserWindow } = require("electron");
const isDevelopment = require("electron-is-dev");
const path = require("path");

require("./ipc.js");
require("./server.js");
require("./store");

const createWindow = () => {
  const window = new BrowserWindow({
    autoHideMenuBar: true,
    // minWidth: 1024,
    // minHeight: 768,
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
