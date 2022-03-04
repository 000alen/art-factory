const uxp = require("uxp");
const photoshop = require("photoshop");
const app = photoshop.app;
const doc = app.activeDocument;

export async function hideAll(executionControl) {
  for (const layer of doc.layers) {
    layer.visible = true;
    for (const layerElement of layer.layers) {
      layerElement.visible = false;
    }
  }
}

export async function exportAll(executionControl, userFolder) {
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

export async function edit(executionControl, name, traits) {
  const newDoc = await app.createDocument({
    name,
    width: doc.width,
    height: doc.height,
  });

  for (let i = doc.layers.length - 1; i >= 0; i--) {
    const layer = doc.layers[i];
    for (const layerElement of layer.layers) {
      const target = traits[doc.layers.length - i - 1].value;
      if (target === layerElement.name) {
        const newLayerElement = await layerElement.duplicate(newDoc);
        newLayerElement.visible = true;
      }
    }
  }
}
