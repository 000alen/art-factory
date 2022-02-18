import React from "react";

import "./css/index.css";
import { PanelController } from "./controllers/PanelController";
import { CommandController } from "./controllers/CommandController";
import { About } from "./components/About";
import { ConfigurationPanel } from "./panels/ConfigurationPanel";
import { socket, SocketContext } from "./components/SocketContext";

import { entrypoints } from "uxp";
import { TestPanel } from "./panels/TestPanel";

socket.on("connect_error", () => {
  socket.emit("reconnect", true);
});

socket.on("server-connection", (connection) => {
  socket.emit("uxp-connected", true);
});

socket.on("message", (helperMessage) => {
  console.log(helperMessage);
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

const testController = new PanelController(
  () => (
    <SocketContext.Provider value={socket}>
      <TestPanel />
    </SocketContext.Provider>
  ),
  {
    id: "test",
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
    test: testController,
  },
});
