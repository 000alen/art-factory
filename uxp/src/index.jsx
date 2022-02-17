import React from "react";
import { io } from "socket.io-client";

import "./css/styles.css";
import { PanelController } from "./controllers/PanelController.jsx";
import { CommandController } from "./controllers/CommandController.jsx";
import { About } from "./components/About.jsx";
import { Demos } from "./panels/Demos.jsx";

import { entrypoints } from "uxp";

const socket = io("http://127.0.0.1:4040");

socket.on("connect_error", () => {
  // updateConnectionStatus(false);
  socket.emit("reconnect", true);
});

socket.on("server-connection", (connection) => {
  // updateConnectionStatus(connection);
  socket.emit("uxp-connected", true);
});

socket.on("message", (helperMessage) => {
  // log.innerText = helperMessage;
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

const demosController = new PanelController(() => <Demos />, {
  id: "demos",
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
});

entrypoints.setup({
  plugin: {
    create(plugin) {
      /*optional */ console.log("created", plugin);
    },
    destroy() {
      /*optional */ console.log("destroyed");
    },
  },
  commands: {
    showAbout: aboutController,
  },
  panels: {
    demos: demosController,
  },
});
