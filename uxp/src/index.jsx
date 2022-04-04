import React from "react";
import { PanelController } from "./controllers/PanelController";
import { CommandController } from "./controllers/CommandController";
import { About } from "./components/About";
import { FactoryPanel } from "./panels/FactoryPanel";
import { socket, SocketContext } from "./components/SocketContext";
import { entrypoints } from "uxp";
import { UXPContextProvider } from "./components/UXPContext";
import "./uxpActions";
import "./css/index.css";

localStorage.clear();

export const aboutController = new CommandController(
  ({ dialog }) => <About dialog={dialog} />,
  {
    id: "showAbout",
    title: "Art Factory",
    size: { width: 480, height: 480 },
  }
);

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
  commands: {
    showAbout: aboutController,
  },
  panels: {
    factory: factoryController,
  },
});
