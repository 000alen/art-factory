import { socket } from "./components/SocketContext";
import { edit } from "./jobs";
import { getActiveDocument, setItem } from "./store";
import { dashedName } from "./utils";

const uxp = require("uxp");
const photoshop = require("photoshop");
const app = photoshop.app;
const fs = uxp.storage.localFileSystem;

socket.on("host-edit", async ({ width, height, name, traits }) => {
  const docName = getActiveDocument();
  if (docName === null) {
    await photoshop.app.showAlert("Active Document is not set.");
    return;
  }

  const doc = app.documents.find((doc) => doc.name === docName);
  if (doc === undefined) {
    await photoshop.app.showAlert("Invalid Active Document.");
    return;
  }

  const id = dashedName();
  setItem(id, {
    width,
    height,
    name,
    traits,
  });

  await photoshop.core.executeAsModal(async () => {
    await edit(doc, id, traits);
  });
});
