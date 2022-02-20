import React, { useState, useContext, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Button,
  Flex,
  Heading,
  TextField,
  NumberField,
  Switch,
  ActionButton,
  TextArea,
  ButtonGroup,
  ProgressBar,
} from "@adobe/react-spectrum";

import { LayerItem } from "../components/LayerItem";
import { ColorPicker } from "../components/ColorPicker";
import Add from "@spectrum-icons/workflow/Add";
import {
  createFactory,
  factorySaveInstance,
  factoryGenerateImages,
  factoryGenerateRandomAttributes,
  factoryEnsureLayers,
  factoryEnsureOutputDir,
} from "../ipc";
import { v4 as uuid } from "uuid";
import "@spectrum-css/fieldlabel/dist/index-vars.css";
import { DialogContext } from "../App";

export function GenerationPage() {
  const dialogContext = useContext(DialogContext);
  const navigator = useNavigate();
  const { state } = useLocation();
  const { inputDir, outputDir, partialConfiguration } = state;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [symbol, setSymbol] = useState("");
  const [n, setN] = useState(1);
  const [width, setWidth] = useState(512);
  const [height, setHeight] = useState(512);
  const [generateBackground, setGenerateBackground] = useState(true);
  const [defaultBackground, setDefaultBackground] = useState("#1e1e1e");
  const [layers, setLayers] = React.useState([""]);
  const [id, setId] = useState(null);
  const [configuration, setConfiguration] = useState(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationDone, setGenerationDone] = useState(false);
  const [currentGeneration, setCurrentGeneration] = useState(0);
  const [attributes, setAttributes] = useState([]);

  const isAbleContinue = useMemo(
    () =>
      name &&
      symbol &&
      width &&
      height &&
      (generateBackground || defaultBackground) &&
      layers.length > 0 &&
      layers.every((layer) => layer.length > 0),
    [name, symbol, width, height, generateBackground, defaultBackground, layers]
  );

  useEffect(() => {
    if (partialConfiguration) {
      if (partialConfiguration.name) setName(partialConfiguration.name);
      if (partialConfiguration.description)
        setDescription(partialConfiguration.description);
      if (partialConfiguration.symbol) setSymbol(partialConfiguration.symbol);
      if (partialConfiguration.width) setWidth(partialConfiguration.width);
      if (partialConfiguration.height) setHeight(partialConfiguration.height);
      if (partialConfiguration.generateBackground)
        setGenerateBackground(partialConfiguration.generateBackground);
      // ! TODO
      // if (partialConfiguration.defaultBackground)
      //   setDefaultBackground(partialConfiguration.defaultBackground);
      if (partialConfiguration.layers) setLayers(partialConfiguration.layers);
    }
  }, []);

  const onClickAddLayer = () => {
    setLayers([...layers, ""]);
  };

  const onEditLayer = (i, value) => {
    setLayers(layers.map((layer, index) => (index === i ? value : layer)));
  };

  const onRemoveLayer = (i) => {
    setLayers(layers.filter((layer, index) => index !== i));
  };

  const onProgress = (i) => {
    setCurrentGeneration((prevGeneration) => prevGeneration + 1);
  };

  const onGenerate = async () => {
    setIsGenerating(true);

    const _id = uuid();
    const _configuration = {
      name,
      description,
      symbol,
      width: Number(width),
      height: Number(height),
      generateBackground,
      defaultBackground,
      layers,
    };

    let _attributes;

    // ! TODO
    try {
      await createFactory(_id, _configuration, inputDir, outputDir, {
        n,
      });
      await factorySaveInstance(_id);
      await factoryEnsureLayers(_id);
      await factoryEnsureOutputDir(_id);
      _attributes = await factoryGenerateRandomAttributes(_id, n);
      await factoryGenerateImages(_id, _attributes, onProgress);
      await factorySaveInstance(_id);
    } catch (error) {
      dialogContext.setDialog("Error", error.message, null, true);
      return;
    }

    setId(_id);
    setConfiguration(_configuration);
    setAttributes(_attributes);
    setGenerationDone(true);
    setIsGenerating(false);
  };

  const onContinue = () => {
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
    <Flex direction="column" height="100%" margin="size-100" gap="size-100">
      <Heading level={1} marginStart={16}>
        Configuration
      </Heading>

      <Flex
        direction="row"
        height="100%"
        gap="size-100"
        justifyContent="space-evenly"
      >
        <Flex direction="column">
          <TextField label="Name" value={name} onChange={setName} />
          <TextArea
            label="Description"
            value={description}
            onChange={setDescription}
          />

          <TextField label="Symbol" value={symbol} onChange={setSymbol} />

          <Switch
            margin="size-10"
            isSelected={generateBackground}
            onChange={setGenerateBackground}
          >
            Generate Background
          </Switch>

          <div>
            <label className="spectrum-FieldLabel">Default Background</label>

            {/* ! TODO: this breaks the code */}
            <ColorPicker
              color={defaultBackground}
              setColor={setDefaultBackground}
              isDisabled={generateBackground}
            />
          </div>
        </Flex>

        <Flex direction="column">
          <NumberField
            label="N"
            defaultValue={10}
            minValue={1}
            value={n}
            onChange={setN}
          />
          <NumberField label="Width" value={width} onChange={setWidth} />
          <NumberField label="Height" value={height} onChange={setHeight} />
        </Flex>

        <Flex direction="column">
          <label className="spectrum-FieldLabel">Layers</label>

          <Flex direction="column" gap="size-100">
            {layers.map((layer, index) => (
              <LayerItem
                key={index}
                value={layer}
                index={index}
                onChange={onEditLayer}
                onRemove={onRemoveLayer}
              />
            ))}
          </Flex>

          <ButtonGroup marginTop="size-100">
            <ActionButton onPress={onClickAddLayer}>
              <Add />
            </ActionButton>
          </ButtonGroup>
        </Flex>
      </Flex>

      {isGenerating ? (
        <Flex marginBottom={8} marginX={8} justifyContent="end">
          <ProgressBar
            label="Deploying…"
            minValue={0}
            maxValue={n}
            value={currentGeneration}
          />
        </Flex>
      ) : (
        <ButtonGroup align="end" marginBottom={8} marginEnd={8}>
          {generationDone ? (
            <Button variant="cta" onPress={onContinue}>
              Continue!
            </Button>
          ) : (
            <Button
              variant="cta"
              onPress={onGenerate}
              isDisabled={!isAbleContinue}
            >
              Generate!
            </Button>
          )}
        </ButtonGroup>
      )}
    </Flex>
  );
}
