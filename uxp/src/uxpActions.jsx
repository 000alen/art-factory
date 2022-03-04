import { socket } from "./components/SocketContext";
import { edit } from "./jobs";
import { getDocument, getFolder } from "./store";
import { editionController } from "./index";

const uxp = require("uxp");
const photoshop = require("photoshop");
const app = photoshop.app;
const fs = uxp.storage.localFileSystem;

socket.on("host-edit", async ({ photoshopId, name, traits }) => {
  const doc = app.documents.getByName(getDocument(photoshopId));
  const token = getFolder(photoshopId);
  const folder = await fs.getEntryForPersistentToken(token);

  editionController.create();
  console.log("done")

  // // ! TODO
  // await photoshop.core.executeAsModal(async (executionControl) => {
  //   await edit(executionControl, doc, name, traits);
  //   editionController.show();
  // });
});
