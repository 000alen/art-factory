import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  createFactory,
  factoryBootstrapOutput,
  factoryGenerateImages,
  factoryLoadLayers,
  factoryGenerateRandomAttributes,
  factoryGetRandomGeneratedImage,
} from "../ipcRenderer";
import { v4 as uuid } from "uuid";
import {
  Button,
  Flex,
  ProgressBar,
  ProgressCircle,
} from "@adobe/react-spectrum";

export function GenerationPage() {
  const navigator = useNavigate();
  const { state } = useLocation();
  const { inputDir, outputDir, configuration } = state;

  const [id, setId] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationDone, setGenerationDone] = useState(false);
  const [maxGenerations, setMaxGenerations] = useState(100);
  const [currentGeneration, setCurrentGeneration] = useState(0);

  useEffect(() => {
    const _id = uuid();
    createFactory(_id, configuration, inputDir, outputDir).then(() => {
      setId(_id);
    });
  }, []);

  const onProgress = (i) => {
    setCurrentGeneration((prevGeneration) => prevGeneration + 1);
  };

  const onClickGenerate = async () => {
    setIsGenerating(true);
    await factoryLoadLayers(id);
    await factoryBootstrapOutput(id);
    const attributes = await factoryGenerateRandomAttributes(id, 100);
    await factoryGenerateImages(id, attributes, onProgress);

    const buffer = await factoryGetRandomGeneratedImage(id, attributes);
    const blob = new Blob([buffer], { type: "image/png" });
    const url = URL.createObjectURL(blob);

    setImageUrl(url);
    setIsGenerating(false);
    setGenerationDone(true);
  };

  const onClickContinue = () => {
    navigator("/quality", {
      state: {
        id,
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
      justifyContent="center"
      alignItems="center"
      gap="size-250"
    >
      <div className="w-56 h-56 p-2 border-dashed border-2 border-white rounded-md flex justify-center items-center">
        {isGenerating ? (
          <ProgressCircle aria-label="Loading…" isIndeterminate />
        ) : generationDone ? (
          <img className="rounded-md w-56 h-56" src={imageUrl}></img>
        ) : (
          <></>
        )}
      </div>

      {isGenerating ? (
        <ProgressBar
          label="Generating..."
          minValue={0}
          maxValue={maxGenerations}
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
