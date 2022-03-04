import { socket } from "./components/SocketContext";

import { edit } from "./jobs";

socket.on("host-edit", ({ name, traits }) => {
  const photoshop = require("photoshop");
  const app = photoshop.app;

  // ! TODO
  photoshop.core.executeAsModal(async (executionControl) => {
    await edit(executionControl, name, traits);
  });
});
