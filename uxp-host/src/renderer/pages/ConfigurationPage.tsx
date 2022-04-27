import React, { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
    ActionButton, Button, ButtonGroup, Flex, Heading, Item, ListBox, NumberField, Radio, RadioGroup,
    Slider, Switch, TextArea, TextField
} from "@adobe/react-spectrum";
import { parseColor } from "@react-stately/color";
import Back from "@spectrum-icons/workflow/Back";
import Refresh from "@spectrum-icons/workflow/Refresh";

import { ColorPicker } from "../components/ColorPicker";
import { useErrorHandler } from "../components/ErrorHandler";
import { ToolbarContext } from "../components/Toolbar";
import { factoryGetResolution, readProjectAvailableLayers } from "../ipc";
import { Configuration, ContractType, Instance } from "../typings";

interface ConfigurationPageState {
  projectDir: string;
  id: string;
  instance: Instance;
  dirty: boolean;
}

export function ConfigurationPage() {
  const toolbarContext = useContext(ToolbarContext);
  const task = useErrorHandler();
  const navigate = useNavigate();
  const { state } = useLocation();
  const {
    projectDir,
    id,
    instance,
    dirty: _dirty,
  } = state as ConfigurationPageState;

  const { configuration, frozen: _frozen } = instance;

  const [dirty, setDirty] = useState(_dirty);
  const [availableLayers, setAvailableLayers] = useState(configuration.layers);

  const [frozen, _setFrozen] = useState(_frozen);

  const [name, _setName] = useState(configuration.name);
  const [description, _setDescription] = useState(configuration.description);
  const [symbol, _setSymbol] = useState(configuration.symbol);

  const [originalWidth, setOriginalWidth] = useState(configuration.width);
  const [originalHeight, setOriginalHeight] = useState(configuration.height);
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
  const [layers, _setLayers] = useState(configuration.layers);
  const [resolution, setResolution] = useState(100);

  const setter =
    <T,>(set: (v: T | ((v: T) => T)) => void) =>
    (v: T | ((v: T) => T)) => {
      if (frozen) return;
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
  const setLayers = setter(_setLayers);
  const setFrozen = (v: boolean) => {
    _setFrozen(v);
    setDirty(true);
  };

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
    navigate("/factory", { state: { projectDir, id, instance, dirty } });

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
      layers,
    };

    navigate("/factory", {
      state: {
        projectDir,
        id,
        instance: {
          ...instance,
          configuration,
          frozen,
        },
        dirty,
      },
    });
  };

  const onResolutionChange = (value: number) => {
    setWidth(Math.floor(originalWidth * (value / 100)));
    setHeight(Math.floor(originalHeight * (value / 100)));
    setResolution(value);
  };

  const onRefreshResolution = async () => {
    const { width, height } = await factoryGetResolution(id);
    setOriginalWidth(width);
    setOriginalHeight(height);
    setWidth(width);
    setHeight(height);
    setResolution(100);
  };

  const items = availableLayers.map((layer) => ({
    name: layer,
  }));

  return (
    <Flex
      direction="column"
      height="100%"
      margin="size-100"
      gap="size-100"
      justifyContent="space-between"
    >
      <Heading level={1}>
        {dirty && "*"} {frozen && "[frozen]"} Configuration
      </Heading>

      <Flex gap="size-100" justifyContent="space-evenly">
        <Flex direction="column" gap="size-100">
          <TextField
            width="100%"
            isDisabled={frozen}
            label="Name"
            value={name}
            onChange={setName}
          />

          <TextArea
            width="100%"
            isDisabled={frozen}
            label="Description"
            value={description}
            onChange={setDescription}
          />

          <TextField
            width="100%"
            isDisabled={frozen}
            label="Symbol"
            value={symbol}
            onChange={setSymbol}
          />

          <Slider
            width="100%"
            isDisabled={frozen}
            label="Resolution"
            value={resolution}
            minValue={10}
            maxValue={100}
            onChange={onResolutionChange}
          />

          <Flex gap="size-100" alignItems="end">
            <NumberField
              isDisabled={frozen}
              label="Width"
              value={width}
              onChange={setWidth}
              isReadOnly
            />

            <NumberField
              isDisabled={frozen}
              label="Height"
              value={height}
              onChange={setHeight}
              isReadOnly
            />
            <ActionButton isDisabled={frozen} onPress={onRefreshResolution}>
              <Refresh />
            </ActionButton>
          </Flex>

          <Switch
            width="100%"
            isDisabled={frozen}
            isSelected={generateBackground}
            onChange={setGenerateBackground}
          >
            Generate Background
          </Switch>

          <ColorPicker
            label="Default Background"
            color={defaultBackground as any}
            setColor={setDefaultBackground}
            isDisabled={generateBackground || frozen}
          />

          <RadioGroup
            width="100%"
            isDisabled={frozen}
            label="Contract type"
            value={contractType}
            onChange={(v) => setContractType(v as ContractType)}
          >
            <Radio value="721">ERC721</Radio>
            <Radio value="721_reveal_pause">ERC721_reveal_pause</Radio>
          </RadioGroup>
        </Flex>

        <Flex direction="column" gap="size-100">
          <Heading>Layers</Heading>
          <ListBox
            disabledKeys={frozen ? availableLayers : []}
            width="size-2400"
            selectionMode="multiple"
            aria-label="Pick an animal"
            items={items}
            defaultSelectedKeys={layers}
            onSelectionChange={(selectedKeys) =>
              setLayers([...selectedKeys] as string[])
            }
          >
            {(item) => <Item key={item.name}>{item.name}</Item>}
          </ListBox>
        </Flex>

        {_frozen && (
          <Flex>
            <Switch isSelected={frozen} onChange={setFrozen}>
              Frozen
            </Switch>
          </Flex>
        )}
      </Flex>

      <ButtonGroup align="end">
        <Button variant="cta" onPress={onSave}>
          Save
        </Button>
      </ButtonGroup>
    </Flex>
  );
}
