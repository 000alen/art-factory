import React from "react";

import "./css/index.css";
import { PanelController } from "./controllers/PanelController";
import { CommandController } from "./controllers/CommandController";
import { About } from "./components/About";
import { ConfigurationPanel } from "./panels/ConfigurationPanel";
import { socket, SocketContext } from "./components/SocketContext";

import { entrypoints } from "uxp";

socket.on("host-edit", ({ name, traits }) => {
  const uxp = require("uxp");
  const photoshop = require("photoshop");
  const app = photoshop.app;
  const doc = app.activeDocument;

  photoshop.core.executeAsModal(async () => {
    const newDoc = await app.createDocument({
      name,
      width: doc.width,
      height: doc.height,
    });

    for (let i = doc.layers.length - 1; i >= 0; i--) {
      const layer = doc.layers[i];
      for (const layerElement of layer.layers) {
        const target = traits[doc.layers.length - i - 1].value;
        if (target === layerElement.name) {
          const newLayerElement = await layerElement.duplicate(newDoc);
          newLayerElement.visible = true;
        }
      }
    }
  });
});

const aboutController = new CommandController(
  ({ dialog }) => <About dialog={dialog} />,
  {
    id: "showAbout",
    title: "React Starter Plugin Demo",
    size: { width: 480, height: 480 },
  }
);

const configurationController = new PanelController(
  () => (
    <SocketContext.Provider value={socket}>
      <ConfigurationPanel />
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
