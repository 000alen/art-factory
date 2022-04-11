import React, { useState, useContext, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button, Flex, Heading, ButtonGroup } from "@adobe/react-spectrum";

import { Configuration721 } from "../components/Configuration721";
import { ConfigurationBase } from "../components/ConfigurationBase";
import { ConfigurationLayers } from "../components/ConfigurationLayers";
import { ToolbarContext } from "../components/Toolbar";
import { parseColor } from "@react-stately/color";
import { Configuration, Instance } from "../newTypings";

import Back from "@spectrum-icons/workflow/Back";
import Close from "@spectrum-icons/workflow/Close";
import { readProjectAvailableLayers } from "../ipc";
import { useErrorHandler } from "../components/ErrorHandler";

interface ConfigurationPageState {
  projectDir: string;
  instance: Instance;
  id: string;
}

export function ConfigurationPage() {
  const toolbarContext = useContext(ToolbarContext);
  const task = useErrorHandler();
  const navigate = useNavigate();
  const { state } = useLocation();
  const { projectDir, instance, id } = state as ConfigurationPageState;
  const { configuration } = instance;

  // ConfigurationBase
  const [name, setName] = useState(configuration.name);
  const [description, setDescription] = useState(configuration.description);
  const [symbol, setSymbol] = useState(configuration.symbol);

  const [originalWidth] = useState(configuration.width);
  const [originalHeight] = useState(configuration.height);
  const [width, setWidth] = useState(configuration.width);
  const [height, setHeight] = useState(configuration.height);
  const [generateBackground, setGenerateBackground] = useState(
    configuration.generateBackground
  );
  const [defaultBackground, _setDefaultBackground] = useState(
    parseColor("#ffffff")
  ); // ! TODO: use configuration.defaultBackground
  const [contractType, setContractType] = useState(configuration.contractType);
  const [cost, setCost] = useState(configuration.cost);
  const [maxMintAmount, setMaxMintAmount] = useState(
    configuration.maxMintAmount
  );

  const [availableLayers, setAvailableLayers] = useState(configuration.layers);
  const [layers, setLayers] = useState(configuration.layers);

  useEffect(() => {
    toolbarContext.addButton("close", "Close", <Close />, () => navigate("/"));
    toolbarContext.addButton("back", "Back", <Back />, () =>
      navigate("/factory", { state: { projectDir, instance, id } })
    );

    task("available layers", async () => {
      setAvailableLayers(await readProjectAvailableLayers(projectDir));
    })();

    return () => {
      toolbarContext.removeButton("close");
      toolbarContext.removeButton("back");
    };
  }, []);

  const setDefaultBackground = (color: any) => {
    _setDefaultBackground(color);
  };

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

        <Configuration721
          {...{
            cost,
            setCost,
            maxMintAmount,
            setMaxMintAmount,
          }}
        />

        <ConfigurationLayers
          {...{
            availableLayers,
            layers,
            setLayers,
          }}
        />
      </Flex>

      <ButtonGroup align="end" marginBottom={8} marginEnd={8}>
        <Button variant="cta" onPress={onSave}>
          Save
        </Button>
      </ButtonGroup>
    </Flex>
  );
}
