import React, { useState, useContext, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, Flex, Heading, ButtonGroup } from "@adobe/react-spectrum";

import { layersNames, name as _name, sizeOf } from "../ipc";
import "@spectrum-css/fieldlabel/dist/index-vars.css";
import { Configuration721 } from "../components/Configuration721";
import { Configuration1155 } from "../components/Configuration1155";
import { ConfigurationBase } from "../components/ConfigurationBase";
import { ConfigurationLayers } from "../components/ConfigurationLayers";
import { GenericDialogContext } from "../components/GenericDialog";
import { initializeFactory } from "../actions";

export function GenerationPage() {
  const genericDialogContext = useContext(GenericDialogContext);
  const navigator = useNavigate();
  const { state } = useLocation();
  const { inputDir, outputDir, photoshop, partialConfiguration } = state;

  // ConfigurationBase
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [symbol, setSymbol] = useState("");
  const [width, setWidth] = useState(512);
  const [height, setHeight] = useState(512);
  const [generateBackground, setGenerateBackground] = useState(true);
  const [defaultBackground, _setDefaultBackground] = useState("#1e1e1e");
  const [contractType, setContractType] = useState("721");

  // Configuration721
  const [cost, setCost] = useState("0.05");
  const [maxMintAmount, setMaxMintAmount] = useState(20);

  // Configuration1155
  // ! TODO: Add 1155 configuration

  const [layers, setLayers] = useState([""]);

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
      if (partialConfiguration.defaultBackground)
        setDefaultBackground(partialConfiguration.defaultBackground);
      if (partialConfiguration.contractType)
        setContractType(partialConfiguration.contractType);

      if (partialConfiguration.cost) setCost(partialConfiguration.cost);
      if (partialConfiguration.maxMintAmount)
        setMaxMintAmount(partialConfiguration.maxMintAmount);

      if (partialConfiguration.layers) setLayers(partialConfiguration.layers);
    }

    // ! TODO: Proper error handling
    layersNames(inputDir)
      .then((names) => {
        setLayers(names);
      })
      .catch((error) => {
        genericDialogContext.show("Error", error.message, null);
      });

    // ! TODO: Proper error handling
    _name(inputDir)
      .then((name) => {
        setName(name);
      })
      .catch((error) => {
        genericDialogContext.show("Error", error.message, null);
      });

    // ! TODO: Proper error handling
    sizeOf(inputDir)
      .then(({ width, height }) => {
        setWidth(width);
        setHeight(height);
      })
      .catch((error) => {
        genericDialogContext.show("Error", error.message, null);
      });
  }, [genericDialogContext, inputDir, partialConfiguration]);

  const canContinue = useMemo(
    () =>
      name &&
      description &&
      symbol &&
      width &&
      height &&
      (generateBackground || defaultBackground) &&
      contractType &&
      (contractType === "721"
        ? cost && maxMintAmount
        : contractType === "1155"
        ? true
        : false) &&
      layers.length > 0 &&
      layers.every((layer) => layer.length > 0),
    [
      name,
      description,
      symbol,
      width,
      height,
      generateBackground,
      defaultBackground,
      contractType,
      cost,
      maxMintAmount,
      layers,
    ]
  );

  const setDefaultBackground = (color) => {
    _setDefaultBackground(color.toString("hex"));
  };

  const onContinue = async () => {
    const partialConfiguration = {
      name,
      description,
      symbol,
      width: width,
      height: height,
      generateBackground,
      defaultBackground,
      contractType,

      ...(contractType === "721"
        ? {
            cost,
            maxMintAmount,
          }
        : contractType === "1155"
        ? {}
        : {}),

      layers,
    };

    let id;

    // ! TODO: Proper error handling
    try {
      ({ id } = await initializeFactory(
        partialConfiguration,
        inputDir,
        outputDir
      ));
    } catch (error) {
      genericDialogContext.show("Error", error.message, null);
      return;
    }

    navigator("/nodes", {
      state: {
        id,
        inputDir,
        outputDir,
        photoshop,
        partialConfiguration,
      },
    });
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

      <ButtonGroup align="end" marginBottom={8} marginEnd={8}>
        <Button variant="cta" onPress={onContinue} isDisabled={!canContinue}>
          Continue!
        </Button>
      </ButtonGroup>
    </Flex>
  );
}
