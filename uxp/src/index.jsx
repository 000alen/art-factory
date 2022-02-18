import React from "react";
import { io } from "socket.io-client";

import "./css/index.css";
import { PanelController } from "./controllers/PanelController";
import { CommandController } from "./controllers/CommandController";
import { About } from "./components/About";
import { ConfigurationPanel } from "./panels/ConfigurationPanel";

import { entrypoints } from "uxp";
import { TestPanel } from "./panels/TestPanel";

const socket = io("http://127.0.0.1:4040");

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
  () => <ConfigurationPanel />,
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

const testController = new PanelController(() => <TestPanel />, {
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
});

entrypoints.setup({
  commands: {
    showAbout: aboutController,
  },
  panels: {
    configuration: configurationController,
    test: testController,
  },
});
