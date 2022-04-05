import React, { useState, useContext, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, Flex, Heading, ButtonGroup } from "@adobe/react-spectrum";

import { layersNames, name as _name, sizeOf } from "../ipc";
import "@spectrum-css/fieldlabel/dist/index-vars.css";
import { Configuration721 } from "../components/Configuration721";
import { Configuration1155 } from "../components/Configuration1155";
import { ConfigurationBase } from "../components/ConfigurationBase";
import { ConfigurationLayers } from "../components/ConfigurationLayers";
import { initializeFactory } from "../actions";
import { useErrorHandler } from "../components/ErrorHandler";
import { ToolbarContext } from "../components/Toolbar";
import Close from "@spectrum-icons/workflow/Close";
import { Configuration } from "../typings";
import { parseColor } from "@react-stately/color";

interface ConfigurationPageState {
  inputDir: string;
  outputDir: string;
  partialConfiguration: Partial<Configuration>;
}

export function ConfigurationPage() {
  const toolbarContext = useContext(ToolbarContext);
  const task = useErrorHandler();
  const navigate = useNavigate();
  const { state } = useLocation();
  const { inputDir, outputDir, partialConfiguration } =
    state as ConfigurationPageState;

  // ConfigurationBase
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [symbol, setSymbol] = useState("");

  const [originalWidth, setOriginalWidth] = useState(null);
  const [originalHeight, setOriginalHeight] = useState(null);
  const [width, setWidth] = useState(512);
  const [height, setHeight] = useState(512);
  const [generateBackground, setGenerateBackground] = useState(true);
  // const [defaultBackground, _setDefaultBackground] = useState("#ffffff");
  const [defaultBackground, _setDefaultBackground] = useState(
    parseColor("#ffffff")
  );
  const [contractType, setContractType] = useState("721");

  // Configuration721
  const [cost, setCost] = useState(0.05);
  const [maxMintAmount, setMaxMintAmount] = useState(20);

  const [layers, setLayers] = useState([""]);

  useEffect(() => {
    toolbarContext.addButton("close", "Close", <Close />, () => navigate("/"));

    const loadInformation = task("load information", async () => {
      const layers = (await layersNames(inputDir)) as string[];
      const name = (await _name(inputDir)) as string;
      const { width, height } = (await sizeOf(inputDir)) as {
        width: number;
        height: number;
      };
      setLayers(layers);
      setName(name);
      setOriginalWidth(width);
      setOriginalHeight(height);
      setWidth(width);
      setHeight(height);
    });

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

      if ("cost" in partialConfiguration && partialConfiguration.cost)
        setCost(partialConfiguration.cost);
      if (
        "maxMintAmount" in partialConfiguration &&
        partialConfiguration.maxMintAmount
      )
        setMaxMintAmount(partialConfiguration.maxMintAmount);

      if (partialConfiguration.layers) setLayers(partialConfiguration.layers);
    } else {
      loadInformation();
    }

    return () => {
      toolbarContext.removeButton("close");
    };
  }, [inputDir, partialConfiguration]);

  const canContinue = useMemo(
    () =>
      name &&
      description &&
      symbol &&
      width &&
      height &&
      (generateBackground || defaultBackground) &&
      contractType &&
      (contractType === "721" || contractType === "721_reveal_pause"
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

  const setDefaultBackground = (color: any) => {
    _setDefaultBackground(color);
  };

  const onContinue = task("initializing factory", async () => {
    const partialConfiguration = {
      name,
      description,
      symbol,
      width,
      height,
      generateBackground,
      defaultBackground: {
        r: defaultBackground.getChannelValue("red"),
        g: defaultBackground.getChannelValue("green"),
        b: defaultBackground.getChannelValue("blue"),
        a: defaultBackground.getChannelValue("alpha"),
      },
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
    } as Partial<Configuration>;

    const { id } = await initializeFactory(
      partialConfiguration,
      inputDir,
      outputDir
    );

    navigate("/nodes", {
      state: {
        id,
        inputDir,
        outputDir,
        partialConfiguration,
      },
    });
  });

  return (
    <Flex
      direction="column"
      height="100%"
      margin="size-100"
      gap="size-100"
      justifyContent="space-between"
    >
      <Heading level={1} marginStart={16}>
        Configuration
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
            originalWidth,
            originalHeight,
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
        ) : contractType === "721_reveal_pause" ? (
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
