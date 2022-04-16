import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Button, ButtonGroup, Flex, Heading } from "@adobe/react-spectrum";
import { parseColor } from "@react-stately/color";
import Back from "@spectrum-icons/workflow/Back";
import Close from "@spectrum-icons/workflow/Close";

import { Configuration721 } from "../components/Configuration721";
import { ConfigurationBase } from "../components/ConfigurationBase";
import { ConfigurationLayers } from "../components/ConfigurationLayers";
import { useErrorHandler } from "../components/ErrorHandler";
import { ToolbarContext } from "../components/Toolbar";
import { readProjectAvailableLayers } from "../ipc";
import { Configuration, Instance } from "../typings";
import { Configuration721_reveal_pause } from "../components/Configuration721_reveal_pause";

interface ConfigurationPageState {
  projectDir: string;
  instance: Instance;
  id: string;
  dirty: boolean;
}

export function ConfigurationPage() {
  const toolbarContext = useContext(ToolbarContext);
  const task = useErrorHandler();
  const navigate = useNavigate();
  const { state } = useLocation();
  const {
    projectDir,
    instance,
    id,
    dirty: _dirty,
  } = state as ConfigurationPageState;
  const { configuration } = instance;

  const [dirty, setDirty] = useState(_dirty);
  const [availableLayers, setAvailableLayers] = useState(configuration.layers);

  const [name, _setName] = useState(configuration.name);
  const [description, _setDescription] = useState(configuration.description);
  const [symbol, _setSymbol] = useState(configuration.symbol);

  const [originalWidth] = useState(configuration.width);
  const [originalHeight] = useState(configuration.height);
  const [width, _setWidth] = useState(configuration.width);
  const [height, _setHeight] = useState(configuration.height);
  const [generateBackground, _setGenerateBackground] = useState(
    configuration.generateBackground
  );
  const [defaultBackground, _setDefaultBackground] = useState(
    parseColor(
      `rgba(${configuration.defaultBackground.r}, ${configuration.defaultBackground.g}, ${configuration.defaultBackground.b}, ${configuration.defaultBackground.a})`
    )
  );
  const [contractType, _setContractType] = useState(configuration.contractType);
  const [cost, _setCost] = useState(configuration.cost);
  const [maxMintAmount, _setMaxMintAmount] = useState(
    configuration.maxMintAmount
  );
  const [layers, _setLayers] = useState(configuration.layers);

  const setter =
    <T,>(set: (v: T | ((v: T) => T)) => void) =>
    (v: T | ((v: T) => T)) => {
      set(v);
      setDirty(true);
    };
  const setName = setter(_setName);
  const setDescription = setter(_setDescription);
  const setSymbol = setter(_setSymbol);
  const setWidth = setter(_setWidth);
  const setHeight = setter(_setHeight);
  const setGenerateBackground = setter(_setGenerateBackground);
  const setDefaultBackground = setter(_setDefaultBackground);
  const setContractType = setter(_setContractType);
  const setCost = setter(_setCost);
  const setMaxMintAmount = setter(_setMaxMintAmount);
  const setLayers = setter(_setLayers);

  useEffect(() => {
    toolbarContext.addButton("back", "Back", <Back />, () => onBack());

    return () => {
      toolbarContext.removeButton("back");
    };
  }, []);

  useEffect(() => {
    task("available layers", async () =>
      setAvailableLayers(await readProjectAvailableLayers(projectDir))
    )();
  }, []);

  const onBack = () =>
    navigate("/factory", { state: { projectDir, instance, id, dirty } });

  const onSave = () => {
    const configuration: Configuration = {
      name,
      description,
      symbol,
      contractType,
      width,
      height,
      generateBackground,
      defaultBackground: {
        r: defaultBackground.getChannelValue("red"),
        g: defaultBackground.getChannelValue("green"),
        b: defaultBackground.getChannelValue("blue"),
        a: defaultBackground.getChannelValue("alpha"),
      },
      cost,
      maxMintAmount,
      layers,
    };

    navigate("/factory", {
      state: {
        projectDir,
        instance: {
          ...instance,
          configuration,
        },
        id,
        dirty,
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
      <Heading level={1}>{dirty && "*"} Configuration</Heading>

      <Flex gap="size-100" justifyContent="space-evenly">
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
          <Configuration721_reveal_pause
            {...{
              cost,
              setCost,
              maxMintAmount,
              setMaxMintAmount,
            }}
          />
        ) : null}

        <ConfigurationLayers
          {...{
            availableLayers,
            layers,
            setLayers,
          }}
        />
      </Flex>

      <ButtonGroup align="end">
        <Button variant="cta" onPress={onSave}>
          Save
        </Button>
      </ButtonGroup>
    </Flex>
  );
}
