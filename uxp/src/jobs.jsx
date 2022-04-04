const uxp = require("uxp");
const photoshop = require("photoshop");
const app = photoshop.app;
const fs = uxp.storage.localFileSystem;

export async function hideAll(doc) {
  for (const layer of doc.layers) {
    layer.visible = true;
    for (const layerElement of layer.layers) {
      layerElement.visible = false;
    }
  }
}

export async function exportAll(doc, folder) {
  for (let i = 0; i < doc.layers.length; i++) {
    const layer = doc.layers[i];
    layer.visible = true;

    const layerFolder = await folder.createFolder(layer.name);
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

export async function edit(doc, name, traits) {
  const newDoc = await app.createDocument({
    name,
    width: doc.width,
    height: doc.height,
  });

  for (const { name, value } of traits) {
    const layer = doc.layers.getByName(name);
    const layerElement = layer.layers.getByName(value);
    const newLayerElement = await layerElement.duplicate(newDoc);
    newLayerElement.visible = true;
  }
}
