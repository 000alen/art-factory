import React, { useState } from "react";
import { getItem } from "../store";

const uxp = require("uxp");
const photoshop = require("photoshop");
const app = photoshop.app;
const fs = uxp.storage.localFileSystem;

export function EditionPanel() {
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

  const onSave = () => {};

  return (
    <div className="flex flex-col space-y-2">
      <div>
        <sp-action-button size="m">
          <sp-icon name="ui:Arrow100"></sp-icon>
          {/* EDIT */}
        </sp-action-button>
      </div>

      {/* <sp-button onClick={onLoad}>Load</sp-button> */}
      {name && (
        <sp-body>
          {name} with id {id}
        </sp-body>
      )}
      {traits &&
        traits.map((trait) => (
          <div
            key={trait.name}
            className="p-2 border-2 border-solid border-white rounded"
          >
            <sp-body>
              {trait.name}: {trait.value}
            </sp-body>
          </div>
        ))}
      {photoshopId && <sp-button onClick={onSave}>Save</sp-button>}
    </div>
  );
}
