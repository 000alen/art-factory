import React from "react";

import { PanelController } from "./controllers/PanelController";
import { CommandController } from "./controllers/CommandController";
import { About } from "./components/About";
import { ConfigurationPanel } from "./panels/ConfigurationPanel";
import { socket, SocketContext } from "./components/SocketContext";
import { entrypoints } from "uxp";
import "./uxpContext";

import "./css/index.css";
import { UXPContextProvider } from "./components/UXPContext";

const aboutController = new CommandController(
  ({ dialog }) => <About dialog={dialog} />,
  {
    id: "showAbout",
    title: "POSTON Art Factory",
    size: { width: 480, height: 480 },
  }
);

const configurationController = new PanelController(
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

entrypoints.setup({
  commands: {
    showAbout: aboutController,
  },
  panels: {
    configuration: configurationController,
  },
});
