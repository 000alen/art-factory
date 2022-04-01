import React from "react";
import { createContext, useContext, useEffect, useState } from "react";
import { Trait } from "../typings";
import { SocketContext } from "./SocketContext";

interface UXPContextValue {
  connectionStatus: boolean;
  on: (channel: string, callback: (...args: any[]) => void) => void;
  off: (channel: string, callback: (...args: any[]) => void) => void;
  hostEdit: ({
    photoshopId,
    name,
    traits,
  }: {
    photoshopId: string;
    name: string;
    traits: Trait[];
  }) => void;
}

export const UXPContext = createContext<UXPContextValue>({
  connectionStatus: false,
  on: (channel: string, callback: (...args: any[]) => void) => {},
  off: (channel: string, callback: (...args: any[]) => void) => {},
  hostEdit: ({
    photoshopId,
    name,
    traits,
  }: {
    photoshopId: string;
    name: string;
    traits: Trait[];
  }) => {},
});

export const UXPContextProvider: React.FC = ({ children }) => {
  const socket = useContext(SocketContext);
  const [connectionStatus, setConnectionStatus] = useState(false);

  useEffect(() => {
    socket.on("uxp-connected", (isUXPConnected: boolean) => {
      setConnectionStatus(isUXPConnected);
    });
  }, [socket]);

  const on = (channel: string, callback: (...args: any[]) => void) => {
    socket.on(channel, callback);
  };

  const off = (channel: string, callback: (...args: any[]) => void) => {
    socket.off(channel, callback);
  };

  const hostEdit = ({
    photoshopId,
    name,
    traits,
  }: {
    photoshopId: string;
    name: string;
    traits: Trait[];
  }) => {
    socket.emit("host-edit", {
      photoshopId,
      name,
      traits,
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