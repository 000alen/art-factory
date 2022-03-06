import React from "react";

import { PanelController } from "./controllers/PanelController";
import { CommandController } from "./controllers/CommandController";
import { About } from "./components/About";
import { ConfigurationPanel } from "./panels/ConfigurationPanel";
import { socket, SocketContext } from "./components/SocketContext";
import { entrypoints } from "uxp";
import "./uxpActions";

import "./css/index.css";
import { UXPContextProvider } from "./components/UXPContext";
import { EditionPanel } from "./panels/EditionPanel";

export const aboutController = new CommandController(
  ({ dialog }) => <About dialog={dialog} />,
  {
    id: "showAbout",
    title: "Art Factory",
    size: { width: 480, height: 480 },
  }
);

export const configurationController = new PanelController(
  () => (
    <SocketContext.Provider value={socket}>
      <UXPContextProvider>
        <ConfigurationPanel />
      </UXPContextProvider>
    </SocketContext.Provider>
  ),
  {
    id: "configuration",
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

export const editionController = new PanelController(
  () => (
    <SocketContext.Provider value={socket}>
      <UXPContextProvider>
        <EditionPanel />
      </UXPContextProvider>
    </SocketContext.Provider>
  ),
  {
    id: "edition",
    menuItems: [
      {
        id: "reload2",
        label: "Reload Plugin",
        enabled: true,
        checked: false,
        oninvoke: () => location.reload(),
      },
      {
        id: "dialog2",
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
    configuration: configurationController,
    edition: editionController,
  },
});
