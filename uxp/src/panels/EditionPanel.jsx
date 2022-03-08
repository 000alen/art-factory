import React, { useState, useContext } from "react";
import { getFolder, getItem } from "../store";
import { UXPContext } from "../components/UXPContext";

const uxp = require("uxp");
const photoshop = require("photoshop");
const app = photoshop.app;
const fs = uxp.storage.localFileSystem;

export function EditionPanel() {
  const uxpContext = useContext(UXPContext);

  const [id, setId] = useState(null);
  const [photoshopId, setPhotoshopId] = useState(null);
  const [name, setName] = useState(null);
  const [traits, setTraits] = useState(null);

  const onLoad = () => {
    const re = /(EDIT-)\d+/;
    const doc = app.activeDocument;

    if (!re.test(doc.name)) return;

    const id = doc.name.slice(5);
    const { photoshopId, name, traits } = getItem(id);

    setId(id);
    setPhotoshopId(photoshopId);
    setName(name);
    setTraits(traits);
  };

  // ! TODO
  const asyncJob = async () =>
    new Promise((resolve, reject) =>
      photoshop.core.executeAsModal(async (executionContext) => {
        const doc = app.activeDocument;
        const token = getFolder(photoshopId);
        const folder = await fs.getEntryForPersistentToken(token);
        // const buildFolder = await folder.createFolder(".build");
        const buildFolder = await folder.getEntry(".build");
        const imagesFolder = await buildFolder.getEntry("images");
        // const buildFile = await buildFolder.createFile(`${name}.png`);
        const buildFile = await imagesFolder.getEntry(`${name}.png`);
        await doc.saveAs.png(buildFile);
        resolve();
      })
    );

  const onSave = async () => {
    await asyncJob();
    uxpContext.uxpReload(photoshopId, name);
  };

  return (
    <div className="flex flex-col space-y-2">
      <div>
        <sp-action-button onClick={onLoad}>Load</sp-action-button>
      </div>

      {name && <sp-body>{name}</sp-body>}

      {traits &&
        traits.map((trait) => (
          <sp-textfield
            key={trait.name}
            style={{ width: "100%" }}
            value={trait.value}
            readonly
          >
            <sp-label slot="label">{trait.name}</sp-label>
          </sp-textfield>
        ))}

      {photoshopId && (
        <div className="flex justify-end">
          <sp-button onClick={onSave}>Save</sp-button>
        </div>
      )}
    </div>
  );
}