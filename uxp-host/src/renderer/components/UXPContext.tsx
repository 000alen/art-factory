import React, { createContext, useContext, useEffect, useState } from "react";

import { SocketContext } from "./SocketContext";

export interface Layer {
  document: string;
  photoshopTraitLayer: string;
  name: string;
  value: string;
}

interface UXPContextValue {
  connectionStatus: boolean;
  on: (channel: string, callback: (...args: any[]) => void) => void;
  off: (channel: string, callback: (...args: any[]) => void) => void;
  hostEdit: ({
    width,
    height,
    name,
    generation,
    layers,
  }: {
    width: number;
    height: number;
    name: string;
    generation: string;
    layers: Layer[];
  }) => void;
}

export const UXPContext = createContext<UXPContextValue>(null);

export const UXPContextProvider: React.FC = ({ children }) => {
  const socket = useContext(SocketContext);
  const [connectionStatus, setConnectionStatus] = useState(false);

  useEffect(() => {
    socket.on("uxp-connected", (connected: boolean) =>
      setConnectionStatus(connected)
    );
  }, [socket]);

  const on = (channel: string, callback: (...args: any[]) => void) =>
    socket.on(channel, callback);

  const off = (channel: string, callback: (...args: any[]) => void) =>
    socket.off(channel, callback);

  const hostEdit = ({
    width,
    height,
    name,
    generation,
    layers,
  }: {
    width: number;
    height: number;
    name: string;
    generation: string;
    layers: Layer[];
  }) => {
    socket.emit("host-edit", {
      width,
      height,
      name,
      generation,
      layers,
    });
  };

  return (
    <UXPContext.Provider
      value={{
        connectionStatus,
        on,
        off,
        hostEdit,
      }}
    >
      {children}
    </UXPContext.Provider>
  );
};
