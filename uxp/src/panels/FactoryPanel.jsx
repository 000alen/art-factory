import React, { useContext, useState } from "react";
import { hideAll, exportAll } from "../jobs";
import { UXPContext } from "../components/UXPContext";
import {
  getActiveDocument,
  getActiveFolder,
  setActiveDocument,
  setActiveFolder,
  getItem,
} from "../store";

const uxp = require("uxp");
const photoshop = require("photoshop");
const app = photoshop.app;
const fs = uxp.storage.localFileSystem;

export const FactoryPanel = () => {
  const { connectionStatus, uxpGenerate, uxpReload } = useContext(UXPContext);

  const [activeDocument, _setActiveDocument] = useState(null);
  const [activeFolder, _setActiveFolder] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [editingWidth, setEditingWidth] = useState(null);
  const [editingHeight, setEditingHeight] = useState(null);
  const [editingName, setEditingName] = useState(null);
  const [editingTraits, setEditingTraits] = useState(null);

  const onSet = async () => {
    const job = () =>
      new Promise((resolve) =>
        photoshop.core.executeAsModal(async () => {
          const doc = app.activeDocument;
          const docName = doc.name;
          setActiveDocument(doc.name);

          const folder = await fs.getFolder();
          const token = await fs.createPersistentToken(folder);
          setActiveFolder(token);

          resolve({ docName, token });
        })
      );

    const { docName, token } = await job();

    _setActiveDocument(docName);
    _setActiveFolder(token);
  };

  const onSend = async () => {
    const job = () =>
      new Promise((resolve) =>
        photoshop.core.executeAsModal(async () => {
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

          const token = getActiveFolder();
          if (token === null) {
            await photoshop.app.showAlert("Active Folder is not set.");
            return;
          }

          const folder = await fs.getEntryForPersistentToken(token);

          await hideAll(doc);
          await exportAll(doc, folder);

          const layers = doc.layers.map((layer) => layer.name).reverse();
          const inputDir = folder.nativePath;

          resolve({ layers, inputDir });
        })
      );

    if (connectionStatus) {
      const { layers, inputDir } = await job();

      const partialConfiguration = {
        layers,
      };

      uxpGenerate(inputDir, partialConfiguration);
    } else await photoshop.app.showAlert("Art Factory Host is not connected.");
  };

  const onLoad = async () => {
    const doc = app.activeDocument;
    const id = doc.name;
    const item = getItem(id);

    if (item !== null) {
      const { width, height, name, traits } = item;

      setEditingId(id);
      setEditingWidth(width);
      setEditingHeight(height);
      setEditingName(name);
      setEditingTraits(traits);
    } else await photoshop.app.showAlert("Invalid Document.");
  };

  const onSave = async () => {
    const job = () =>
      new Promise((resolve) =>
        photoshop.core.executeAsModal(async () => {
          const doc = app.activeDocument;
          const token = getActiveFolder();
          const folder = await fs.getEntryForPersistentToken(token);
          const buildFolder = await folder.getEntry(".build");
          const imagesFolder = await buildFolder.getEntry("images");
          const buildFile = await imagesFolder.getEntry(`${editingName}.png`);
          await doc.resizeImage(editingWidth, editingHeight);
          await doc.saveAs.png(buildFile);
          resolve();
        })
      );

    await job();
    uxpReload(editingName);
  };

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex flex-row space-x-1 items-center">
        <div
          className={`w-2 h-2 rounded-full ${
            connectionStatus ? "bg-green-600" : "bg-red-600"
          }`}
        />
        <sp-body size="xs">
          {connectionStatus ? "Connected" : "Disconnected"}
        </sp-body>
      </div>

      <div className="flex flex-col space-y-1">
        <sp-heading className="text-white">Document</sp-heading>

        {activeDocument && (
          <sp-body>
            <sp-icon name="ui:InfoSmall" size="s"></sp-icon>
            Active Document: {activeDocument}
          </sp-body>
        )}

        <div className="flex flex-row space-x-1 items-center">
          <sp-button onClick={onSet}>Set as Active Document</sp-button>

          <sp-button onClick={onSend}>Send to Art Factory Host</sp-button>
        </div>
      </div>

      <sp-divider size="large"></sp-divider>

      <div>
        <sp-heading className="text-white">Edition</sp-heading>

        {editingName && (
          <sp-body>
            <sp-icon name="ui:InfoSmall" size="s"></sp-icon>
            Editing: {editingName}
          </sp-body>
        )}

        <div className="flex flex-row space-x-1 items-center">
          <sp-button onClick={onLoad}>Load</sp-button>

          <sp-button onClick={onSave}>Save</sp-button>
        </div>

        <div>
          {editingTraits &&
            editingTraits.map((trait) => (
              <sp-textfield
                key={trait.name}
                style={{ width: "100%" }}
                value={trait.value}
                readonly
              >
                <sp-label slot="label">{trait.name}</sp-label>
              </sp-textfield>
            ))}
        </div>
      </div>
    </div>
  );
};
