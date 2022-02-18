import React from "react";

const uxp = require("uxp");
const photoshop = require("photoshop");
const app = photoshop.app;
const doc = app.activeDocument;

async function hideAll(executionControl) {
  for (const layer of doc.layers) {
    layer.visible = true;
    for (const layerElement of layer.layers) {
      layerElement.visible = false;
    }
  }
}

async function exportAll(executionControl) {
  const userFolder = await uxp.storage.localFileSystem.getFolder();

  for (let i = 0; i < doc.layers.length; i++) {
    const layer = doc.layers[i];
    layer.visible = true;

    const layerFolder = await userFolder.createFolder(
      `${i + 1}. ${layer.name}`
    );
    for (const layerElement of layer.layers) {
      layerElement.visible = true;

      const layerElementFile = await layerFolder.createFile(
        `${layerElement.name}.png`
      );
      await doc.saveAs.png(layerElementFile);

      layerElement.visible = false;
    }

    layer.visible = false;
  }
}

export function TestPanel() {
  const onClick = async () => {
    await photoshop.core.executeAsModal(hideAll);
    await photoshop.core.executeAsModal(exportAll);
  };

  return (
    <div>
      <sp-button onClick={onClick}>Test</sp-button>
    </div>
  );
}
