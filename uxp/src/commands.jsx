const uxp = require("uxp");
const photoshop = require("photoshop");
const app = photoshop.app;
const fs = uxp.storage.localFileSystem;

export async function hideLayers(doc) {
  for (const layer of doc.layers) {
    layer.visible = true;
    for (const subLayer of layer.layers) subLayer.visible = false;
  }
}

export async function exportLayers(doc, folder) {
  const items = [];
  for (const layer of doc.layers) {
    layer.visible = true;
    const layerFolder = await folder.createFolder(layer.name);
    for (const subLayer of layer.layers) {
      subLayer.visible = true;
      const subLayerFile = await layerFolder.createFile(`${subLayer.name}.png`);
      await doc.saveAs.png(subLayerFile);
      subLayer.visible = false;
      items.push({
        name: layer.name,
        photoshopTraitLayer: subLayer.name,
      });
    }
    layer.visible = false;
  }
  return items;
}

export async function edit(name, layers) {
  const baseLayer = layers[0];
  const baseDoc = app.documents.getByName(baseLayer.document);
  const newDoc = await app.createDocument({
    name,
    width: baseDoc.width,
    height: baseDoc.height,
  });

  for (const { document, name, photoshopTraitLayer } of layers) {
    const doc = app.documents.getByName(document);
    const layer = doc.layers.getByName(name);
    const subLayer = layer.layers.getByName(photoshopTraitLayer);
    const subLayerDuplicate = await subLayer.duplicate(newDoc);
    subLayerDuplicate.visible = true;
  }
}
