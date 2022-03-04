import { createContext, useContext, useEffect, useState } from "react";
import { SocketContext } from "./SocketContext";

export const UXPContext = createContext({
  connectionStatus: false,
  on: (channel, callback) => {},
  off: (channel, callback) => {},
  hostEdit: ({ name, traits }) => {},
});

export function UXPContextProvider({ children }) {
  const socket = useContext(SocketContext);
  const [connectionStatus, setConnectionStatus] = useState(false);

  useEffect(() => {
    socket.on("uxp-connected", (isUXPConnected) => {
      setConnectionStatus(isUXPConnected);
    });
  }, [socket]);

  const on = (channel, callback) => {
    socket.on(channel, callback);
  };

  const off = (channel, callback) => {
    socket.off(channel, callback);
  };

  const hostEdit = ({ photoshopId, name, traits }) => {
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
}
