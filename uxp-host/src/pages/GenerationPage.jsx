import React, { useState, useContext, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Button,
  Flex,
  Heading,
  ButtonGroup,
  ProgressBar,
} from "@adobe/react-spectrum";

import {
  createFactory,
  factorySaveInstance,
  factoryGenerateImages,
  factoryGenerateRandomAttributes,
  factoryEnsureLayers,
  factoryEnsureOutputDir,
  layersNames,
} from "../ipc";
import { v4 as uuid } from "uuid";
import "@spectrum-css/fieldlabel/dist/index-vars.css";
import { DialogContext } from "../App";
import { Configuration721 } from "../components/Configuration721";
import { Configuration1155 } from "../components/Configuration1155";
import { ConfigurationBase } from "../components/ConfigurationBase";
import { ConfigurationLayers } from "../components/ConfigurationLayers";

// ! TODO:
// Try to automatically detect the layers

export function GenerationPage() {
  const dialogContext = useContext(DialogContext);
  const navigator = useNavigate();
  const { state } = useLocation();
  const { inputDir, outputDir, photoshop, partialConfiguration } = state;

  // ConfigurationBase
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [symbol, setSymbol] = useState("");
  const [n, setN] = useState(1);
  const [width, setWidth] = useState(512);
  const [height, setHeight] = useState(512);
  const [generateBackground, setGenerateBackground] = useState(true);
  const [defaultBackground, setDefaultBackground] = useState("#1e1e1e");
  const [contractType, setContractType] = useState("721");

  // Configuration721
  const [cost, setCost] = useState("0.05");
  const [maxMintAmount, setMaxMintAmount] = useState(20);
  const [revealed, setRevealed] = useState(true);
  const [notRevealedUri, setNotRevealedUri] = useState("");

  // Configuration1155
  // ! TODO

  const [layers, setLayers] = useState([""]);
  const [id, setId] = useState(null);
  const [configuration, setConfiguration] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationDone, setGenerationDone] = useState(false);
  const [currentGeneration, setCurrentGeneration] = useState(0);
  const [attributes, setAttributes] = useState([]);

  const canContinue = useMemo(
    () =>
      name &&
      description &&
      symbol &&
      n &&
      width &&
      height &&
      (generateBackground || defaultBackground) &&
      contractType &&
      (contractType === "721"
        ? cost && maxMintAmount && (revealed || notRevealedUri) && maxMintAmount
        : contractType === "1155"
        ? true
        : false) &&
      layers.length > 0 &&
      layers.every((layer) => layer.length > 0),
    [
      name,
      description,
      symbol,
      n,
      width,
      height,
      generateBackground,
      defaultBackground,
      contractType,
      cost,
      maxMintAmount,
      revealed,
      notRevealedUri,
      maxMintAmount,
      layers,
    ]
  );

  useEffect(() => {
    if (partialConfiguration) {
      if (partialConfiguration.name) setName(partialConfiguration.name);
      if (partialConfiguration.description)
        setDescription(partialConfiguration.description);
      if (partialConfiguration.symbol) setSymbol(partialConfiguration.symbol);
      if (partialConfiguration.n) setN(partialConfiguration.n);
      if (partialConfiguration.width) setWidth(partialConfiguration.width);
      if (partialConfiguration.height) setHeight(partialConfiguration.height);
      if (partialConfiguration.generateBackground)
        setGenerateBackground(partialConfiguration.generateBackground);
      // ! TODO
      // if (partialConfiguration.defaultBackground)
      //   setDefaultBackground(partialConfiguration.defaultBackground);
      if (partialConfiguration.contractType)
        setContractType(partialConfiguration.contractType);

      if (partialConfiguration.cost) setCost(partialConfiguration.cost);
      if (partialConfiguration.maxMintAmount)
        setMaxMintAmount(partialConfiguration.maxMintAmount);
      if (partialConfiguration.revealed)
        setRevealed(partialConfiguration.revealed);
      if (partialConfiguration.notRevealedUri)
        setNotRevealedUri(partialConfiguration.notRevealedUri);

      if (partialConfiguration.layers) setLayers(partialConfiguration.layers);
    }

    layersNames(inputDir)
      .then((names) => {
        setLayers(names);
      })
      .catch((error) => {
        dialogContext.setDialog("Error", error.message, null, true);
      });
  }, []);

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
      n: n,
      width: width,
      height: height,
      generateBackground,
      defaultBackground,
      contractType,

      ...(contractType === "721"
        ? {
            cost,
            maxMintAmount,
            revealed,
            notRevealedUri,
          }
        : contractType === "1155"
        ? {}
        : {}),

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
    navigator("/nodes", {
      state: {
        id,
        attributes,
        inputDir,
        outputDir,
        photoshop,
        configuration,
      },
    });

    // navigator("/quality", {
    //   state: {
    //     id,
    //     attributes,
    //     inputDir,
    //     outputDir,
    //     photoshop,
    //     configuration,
    //   },
    // });
  };

  return (
    <Flex
      direction="column"
      height="100%"
      margin="size-100"
      gap="size-100"
      justifyContent="space-between"
    >
      <Heading level={1} marginStart={16}>
        Configuration & Generation
      </Heading>

      <Flex height="70vh" gap="size-100" justifyContent="space-evenly">
        <ConfigurationBase
          {...{
            name,
            setName,
            description,
            setDescription,
            symbol,
            setSymbol,
            n,
            setN,
            width,
            setWidth,
            height,
            setHeight,
            generateBackground,
            setGenerateBackground,
            defaultBackground,
            setDefaultBackground,
            contractType,
            setContractType,
          }}
        />

        {contractType === "721" ? (
          <Configuration721
            {...{
              cost,
              setCost,
              maxMintAmount,
              setMaxMintAmount,
              revealed,
              setRevealed,
              notRevealedUri,
              setNotRevealedUri,
            }}
          />
        ) : contractType === "1155" ? (
          <Configuration1155 {...{}} />
        ) : null}

        <ConfigurationLayers
          {...{
            layers,
            setLayers,
          }}
        />
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
              isDisabled={!canContinue}
            >
              Generate!
            </Button>
          )}
        </ButtonGroup>
      )}
    </Flex>
  );
}
