import React, { createContext, useContext, useEffect, useState } from "react";
import { SocketContext } from "./SocketContext";

export const UXPContext = createContext({
  connectionStatus: false,
  on: (channel, callback) => {},
  off: (channel, callback) => {},
  uxpGenerate: (photoshopId, inputDir, partialConfiguration) => {},
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

  const on = (channel, callback) => {
    socket.on(channel, callback);
  };

  const off = (channel, callback) => {
    socket.off(channel, callback);
  };

  const uxpGenerate = (photoshopId, inputDir, partialConfiguration) => {
    socket.emit("uxp-generate", {
      photoshopId,
      inputDir,
      partialConfiguration,
    });
  };

  return (
    <UXPContext.Provider
      value={{
        connectionStatus,
        on,
        off,
        uxpGenerate,
      }}
    >
      {children}
    </UXPContext.Provider>
  );
}
