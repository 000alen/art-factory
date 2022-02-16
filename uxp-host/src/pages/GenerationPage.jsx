import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  createFactory,
  factoryBootstrapOutput,
  factoryGenerateImages,
  factoryLoadLayers,
  factoryGenerateRandomAttributes,
} from "../ipcRenderer";
import { v4 as uuid } from "uuid";
import {
  Button,
  Flex,
  ProgressBar,
  ProgressCircle,
} from "@adobe/react-spectrum";

export function GenerationPage() {
  const { state } = useLocation();
  const { inputDir, outputDir, configuration } = state;
  const [imageUrl, setImageUrl] = useState(null);

  const [id, setId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const _id = uuid();
    createFactory(_id, configuration, inputDir, outputDir).then(() => {
      setId(_id);
    });
  }, []);

  const onClickGenerate = async () => {
    setIsGenerating(true);

    await factoryLoadLayers(id);
    await factoryBootstrapOutput(id);
    const attributes = await factoryGenerateRandomAttributes(id, 10);
    await factoryGenerateImages(id, attributes);

    setIsGenerating(false);
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
        ) : (
          <img className="rounded-md" src={imageUrl}></img>
        )}
      </div>

      {isGenerating ? (
        <ProgressBar label="Generating..." value={25} />
      ) : (
        <Button variant="cta" onPress={onClickGenerate}>
          Generate!
        </Button>
      )}
    </Flex>
  );
}
