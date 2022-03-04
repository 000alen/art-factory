import { socket } from "./components/SocketContext";
import { edit } from "./jobs";
import { getDocument, getId, setItem } from "./store";
import { editionController } from "./index";

const uxp = require("uxp");
const photoshop = require("photoshop");
const app = photoshop.app;
const fs = uxp.storage.localFileSystem;

socket.on("host-edit", async ({ photoshopId, name, traits }) => {
  const doc = app.documents.getByName(getDocument(photoshopId));

  const id = getId();

  setItem(id, {
    photoshopId,
    name,
    traits,
  });

  await photoshop.core.executeAsModal(async (executionControl) => {
    await edit(executionControl, doc, `EDIT-${id}`, traits);
    editionController.show();
  });
});
