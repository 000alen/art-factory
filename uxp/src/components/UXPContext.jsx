import React, { createContext, useContext, useEffect, useState } from "react";
import { SocketContext, socket } from "./SocketContext";

import { edit } from "../commands";
import { setItem } from "../store";

const uxp = require("uxp");
const photoshop = require("photoshop");
const app = photoshop.app;
const fs = uxp.storage.localFileSystem;

export const UXPContext = createContext({
  connectionStatus: false,
  on: (channel, callback) => {},
  off: (channel, callback) => {},
  uxpExport: (inputDir, partialConfiguration) => {},
  uxpReload: (name) => {},
});

socket.on("host-edit", async ({ width, height, name, generation, layers }) => {
  setItem(name, {
    width,
    height,
    name,
    generation,
    layers,
  });
  await photoshop.core.executeAsModal(
    async () => await edit(`${generation}-${name}`, layers)
  );
});

export function UXPContextProvider({ children }) {
  const socket = useContext(SocketContext);
  const [connectionStatus, setConnectionStatus] = useState(false);

  useEffect(() => {
    socket.on("connect_error", () => {
      socket.emit("reconnect", true);
      setConnectionStatus(false);
    });

    socket.on("server-connection", (connection) => {
      socket.emit("uxp-connected", true);
      setConnectionStatus(true);
    });
  }, [socket]);

  const on = (channel, callback) => socket.on(channel, callback);

  const off = (channel, callback) => socket.off(channel, callback);

  const uxpExport = ({ name, items }) =>
    socket.emit("uxp-export", { name, items });

  const uxpReload = (name) => socket.emit("uxp-reload", { name });

  return (
    <UXPContext.Provider
      value={{
        connectionStatus,
        on,
        off,
        uxpExport,
        uxpReload,
      }}
    >
      {children}
    </UXPContext.Provider>
  );
}
