import React, { useState, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  factoryEnsureOutputDir,
  factoryGenerateImages,
  factoryEnsureLayers,
  factoryGenerateRandomAttributes,
  factoryGetRandomImage,
  factorySaveInstance,
} from "../ipc";
import {
  Button,
  Flex,
  ProgressBar,
  ProgressCircle,
} from "@adobe/react-spectrum";
import { DialogContext } from "../App";

export function GenerationPage() {
  const dialogContext = useContext(DialogContext);
  const navigator = useNavigate();
  const { state } = useLocation();
  const { id, n, inputDir, outputDir, configuration } = state;

  const [imageUrl, setImageUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationDone, setGenerationDone] = useState(false);
  const [currentGeneration, setCurrentGeneration] = useState(0);
  const [attributes, setAttributes] = useState([]);

  const onProgress = (i) => {
    setCurrentGeneration((prevGeneration) => prevGeneration + 1);
  };

  const onClickGenerate = async () => {
    setIsGenerating(true);

    let _attributes;
    let imageBuffer;

    // ! TODO
    try {
      await factoryEnsureLayers(id);
      await factoryEnsureOutputDir(id);
      _attributes = await factoryGenerateRandomAttributes(id, n);
      await factoryGenerateImages(id, _attributes, onProgress);
      imageBuffer = await factoryGetRandomImage(id, _attributes);
      await factorySaveInstance(id);
    } catch (error) {
      dialogContext.setDialog("Error", error.message, null, true);
      return;
    }

    const imageBlob = new Blob([imageBuffer], { type: "image/png" });
    const _imageUrl = URL.createObjectURL(imageBlob);

    setImageUrl(_imageUrl);
    setAttributes(_attributes);
    setIsGenerating(false);
    setGenerationDone(true);
  };

  const onClickContinue = () => {
    navigator("/quality", {
      state: {
        id,
        attributes,
        inputDir,
        outputDir,
        configuration,
      },
    });
  };

  return (
    <Flex
      direction="column"
      height="100%"
      margin="size-100"
      gap="size-100"
      justifyContent="center"
      alignItems="center"
    >
      <div className="w-56 h-56 p-2 border-dashed border-2 border-white rounded-md flex justify-center items-center">
        {isGenerating ? (
          <ProgressCircle aria-label="Loading…" isIndeterminate />
        ) : generationDone ? (
          <img className="rounded-md w-full h-full" src={imageUrl}></img>
        ) : (
          <></>
        )}
      </div>

      {isGenerating ? (
        <ProgressBar
          label="Generating..."
          minValue={0}
          maxValue={n}
          value={currentGeneration}
        />
      ) : generationDone ? (
        <Button variant="cta" onPress={onClickContinue}>
          Continue!
        </Button>
      ) : (
        <Button variant="cta" onPress={onClickGenerate}>
          Generate!
        </Button>
      )}
    </Flex>
  );
}
