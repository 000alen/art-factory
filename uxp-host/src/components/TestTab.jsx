import React, { useState } from "react";
import { Button } from "@adobe/react-spectrum";
import {
  createFactory,
  factoryLoadLayers,
  factoryBootstrapOutput,
  factoryGenerateRandomAttributes,
  factoryGetRandomGeneratedImage,
  factoryGenerateImages,
} from "../ipcRenderer";

export function TestTab() {
  const [imgSrc, setImgSrc] = useState("");

  const onClickTest = async () => {
    const id = "test";
    const n = 10;
    const configuration = {
      name: "test",
      symbol: "test",
      width: 512,
      height: 512,
      generateBackground: true,
      layers: [
        "Eyeball",
        "Eye color",
        "Iris",
        "Shine",
        "Bottom lid",
        "Top lid",
      ],
    };
    const inputDir =
      "C:\\Users\\alenk\\Desktop\\art-factory\\uxp-host\\sample\\input\\";
    const outputDir =
      "C:\\Users\\alenk\\Desktop\\art-factory\\uxp-host\\sample\\output\\";

    await createFactory(id, configuration, inputDir, outputDir);
    await factoryLoadLayers(id);
    await factoryBootstrapOutput(id);
    const attributes = await factoryGenerateRandomAttributes(id, n);
    await factoryGenerateImages(id, attributes, (i) => {
      console.log(`Generated image ${i}`);
    });
    const randomImage = await factoryGetRandomGeneratedImage(id, attributes); // UInt8Array
    const blob = new Blob([randomImage], { type: "image/png" });
    const url = URL.createObjectURL(blob);

    setImgSrc(url);

    // fetch(metadataURI)
    // .then((metadataResponse) => metadataResponse.json())
    // .then((metadata) => fetch(gateway(`${metadata.image.slice(7)}`)))
    // .then((imageResponse) => imageResponse.blob())
    // .then((imageBlob) => setImageUrl(URL.createObjectURL(imageBlob)));
  };

  return (
    <>
      <img alt="" src={imgSrc} />

      <Button marginTop={8} onPress={onClickTest}>
        Test
      </Button>
    </>
  );
}
