import React from "react";
import { PanelController } from "./controllers/PanelController";
import { FactoryPanel } from "./panels/FactoryPanel";
import { socket, SocketContext } from "./components/SocketContext";
import { entrypoints } from "uxp";
import { UXPContextProvider } from "./components/UXPContext";
import "./css/index.css";

localStorage.clear();

export const factoryController = new PanelController(
  () => (
    <SocketContext.Provider value={socket}>
      <UXPContextProvider>
        <FactoryPanel />
      </UXPContextProvider>
    </SocketContext.Provider>
  ),
  {
    id: "factory",
    menuItems: [
      {
        id: "reload1",
        label: "Reload Plugin",
        enabled: true,
        checked: false,
        oninvoke: () => location.reload(),
      },
      {
        id: "dialog1",
        label: "About this Plugin",
        enabled: true,
        checked: false,
        oninvoke: () => aboutController.run(),
      },
    ],
  }
);

entrypoints.setup({
  panels: {
    factory: factoryController,
  },
});
