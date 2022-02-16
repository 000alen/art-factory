const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("ipcRenderer", {
  send: (channel, ...args) => {
    console.log("ipcRenderer.send", channel, ...args);

    const whitelist = [
      "showOpenDialog",
      "showSaveDialog",
      "factoryTest",
      "compilerTest",
      "getContract",
    ];
    if (whitelist.includes(channel)) {
      return ipcRenderer.send(channel, ...args);
    }
  },
  on: (channel, listener) => {
    console.log("ipcRenderer.on", channel, listener);

    const whitelist = [
      "showOpenDialogResult",
      "showSaveDialogResult",
      "factoryTestResult",
      "compilerTestResult",
      "getContractResult",
    ];
    if (whitelist.includes(channel)) {
      return ipcRenderer.on(channel, (event, ...args) => listener(...args));
    }
  },
  once: (channel, listener) => {
    console.log("ipcRenderer.once", channel, listener);

    const whitelist = [
      "showOpenDialogResult",
      "showSaveDialogResult",
      "factoryTestResult",
      "compilerTestResult",
      "getContractResult",
    ];
    if (whitelist.includes(channel)) {
      return ipcRenderer.once(channel, (event, ...args) => listener(...args));
    }
  },
});
