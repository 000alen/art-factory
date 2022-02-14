const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("ipcRenderer", {
  send: (channel, ...args) => {
    const whitelist = ["showOpenDialog", "showSaveDialog"];
    if (whitelist.includes(channel)) {
      return ipcRenderer.send(channel, ...args);
    }
  },
  on: (channel, listener) => {
    const whitelist = ["showOpenDialogResult", "showSaveDialogResult"];
    if (whitelist.includes(channel)) {
      return ipcRenderer.on(channel, (event, ...args) => listener(...args));
    }
  },
  once: (channel, listener) => {
    const whitelist = ["showOpenDialogResult", "showSaveDialogResult"];
    if (whitelist.includes(channel)) {
      return ipcRenderer.once(channel, (event, ...args) => listener(...args));
    }
  },
});
