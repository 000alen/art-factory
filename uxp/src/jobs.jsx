const uxp = require("uxp");
const photoshop = require("photoshop");
const app = photoshop.app;
const fs = uxp.storage.localFileSystem;

export async function hideAll(executionContext, doc) {
  for (const layer of doc.layers) {
    layer.visible = true;
    for (const layerElement of layer.layers) {
      layerElement.visible = false;
    }
  }
}

export async function exportAll(executionContext, doc, userFolder) {
  for (let i = 0; i < doc.layers.length; i++) {
    const layer = doc.layers[i];
    layer.visible = true;

    const layerFolder = await userFolder.createFolder(
      `${doc.layers.length - i}. ${layer.name}`
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

  return userFolder;
}

export async function edit(executionContext, doc, name, traits) {
  const re = /(\d+)\. /;

  const newDoc = await app.createDocument({
    name,
    width: doc.width,
    height: doc.height,
  });

  for (const { name, value } of traits) {
    const displayName = name.replace(re, "");
    const layer = doc.layers.getByName(displayName);
    const layerElement = layer.layers.getByName(value);
    const newLayerElement = await layerElement.duplicate(newDoc);
    newLayerElement.visible = true;
  }
}
