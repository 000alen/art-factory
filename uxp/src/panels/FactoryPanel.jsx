import React, { useContext, useState } from "react";
import { hideLayers, exportLayers } from "../commands";
import { UXPContext } from "../components/UXPContext";
import {
  getProjectFolderToken,
  setProjectFolderToken,
  getItem,
} from "../store";
import {
  Heading,
  Body,
  Button,
  Divider,
  Textfield,
  Label,
  ActionButton,
} from "react-uxp-spectrum";
import { SaveFloppy } from "../components/SaveFloppy";

const uxp = require("uxp");
const photoshop = require("photoshop");
const app = photoshop.app;
const fs = uxp.storage.localFileSystem;

export const FactoryPanel = () => {
  const { connectionStatus, uxpExport, uxpReload } = useContext(UXPContext);

  const onSave = async () => {
    const doc = app.activeDocument;
    const [generation, name] = doc.name.split("-");
    const { width, height } = getItem(name);

    let projectFolder;
    let projectFolderToken = getProjectFolderToken();
    if (!projectFolderToken) {
      projectFolder = await fs.getFolder();
      projectFolderToken = await fs.createPersistentToken(projectFolder);
      setProjectFolderToken(projectFolderToken);
    } else
      projectFolder = await fs.getEntryForPersistentToken(projectFolderToken);

    const buildFolder = await projectFolder.getEntry(".build");
    const imagesFolder = await buildFolder.getEntry("images");
    const generationFolder = await imagesFolder.getEntry(generation);
    const buildFile = await generationFolder.getEntry(`${name}.png`);

    await photoshop.core.executeAsModal(async () => {
      await doc.resizeImage(width, height);
      await doc.saveAs.png(buildFile);
    });

    uxpReload(name);
  };

  const onExport = async () => {
    const doc = app.activeDocument;
    let projectFolder;
    let projectFolderToken = getProjectFolderToken();
    if (!projectFolderToken) {
      projectFolder = await fs.getFolder();
      projectFolderToken = await fs.createPersistentToken(projectFolder);
      setProjectFolderToken(projectFolderToken);
    } else
      projectFolder = await fs.getEntryForPersistentToken(projectFolderToken);

    const items = await photoshop.core.executeAsModal(async () => {
      await hideLayers(doc);
      return await exportLayers(doc, projectFolder);
    });

    if (connectionStatus) uxpExport({ name: doc.name, items });
  };

  return (
    <div className="flex flex-col space-y-1 overflow-auto">
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

      <div className="flex flex-row space-x-1 items-center">
        <ActionButton onClick={onExport}>Export</ActionButton>
        <ActionButton onClick={onSave}>
          <SaveFloppy />
        </ActionButton>
      </div>

      {/* <Divider /> */}

      {/* <div className="flex flex-col">
        <div className="flex flex-row space-x-1 items-center">
          <Heading>Edition</Heading>
          <ActionButton onClick={onSave}>
            <SaveFloppy />
          </ActionButton>
        </div>

        {editingName && <Body>Editing: {editingName}</Body>}

        <div className="flex flex-row space-x-1 items-center">
          <Button onClick={onLoad}>Load</Button>
        </div>

        <div>
          {editingTraits &&
            editingTraits.map((trait) => (
              <Textfield key={trait.name} value={trait.value} disabled>
                <Label slot="label">{trait.name}</Label>
              </Textfield>
            ))}
        </div>
      </div> */}
    </div>
  );
};
