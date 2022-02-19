import React, { useState, useContext } from "react";
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
} from "@adobe/react-spectrum";
import { ColorSlider } from "@react-spectrum/color";

import Add from "@spectrum-icons/workflow/Add";
import Remove from "@spectrum-icons/workflow/Remove";
import { createFactory, factorySaveInstance } from "../ipc";
import { v4 as uuid } from "uuid";
import "@spectrum-css/fieldlabel/dist/index-vars.css";
import { DialogContext } from "../App";

const Item = ({ value, index, onChange, onRemove }) => {
  return (
    <Flex gap="size-100">
      <TextField
        aria-label={`Layer ${index}: ${value}`}
        value={value}
        onChange={(_value) => onChange(index, _value)}
      />
      <ActionButton onPress={() => onRemove(index)}>
        <Remove />
      </ActionButton>
    </Flex>
  );
};

function ColorPicker({ color, setColor, isDisabled }) {
  return (
    <Flex direction="column">
      <ColorSlider
        isDisabled={isDisabled}
        channel="red"
        value={color}
        onChange={setColor}
      />
      <ColorSlider
        isDisabled={isDisabled}
        channel="green"
        value={color}
        onChange={setColor}
      />
      <ColorSlider
        isDisabled={isDisabled}
        channel="blue"
        value={color}
        onChange={setColor}
      />
      <ColorSlider
        isDisabled={isDisabled}
        channel="alpha"
        value={color}
        onChange={setColor}
      />
    </Flex>
  );
}

export function ConfigurationPage() {
  const dialogContext = useContext(DialogContext);
  const navigator = useNavigate();
  const { state } = useLocation();
  const { inputDir, outputDir } = state;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [symbol, setSymbol] = useState("");
  const [n, setN] = useState(1);
  const [width, setWidth] = useState(512);
  const [height, setHeight] = useState(512);
  const [generateBackground, setGenerateBackground] = useState(true);
  const [defaultBackground, setDefaultBackground] = useState("#1e1e1e");
  const [layers, setLayers] = React.useState([""]);

  const isAbleContinue =
    name &&
    symbol &&
    width &&
    height &&
    (generateBackground || defaultBackground) &&
    layers.length > 0 &&
    layers.every((layer) => layer.length > 0);

  const onClickAddLayer = () => {
    setLayers([...layers, ""]);
  };

  const onEditLayer = (i, value) => {
    setLayers(layers.map((layer, index) => (index === i ? value : layer)));
  };

  const onRemoveLayer = (i) => {
    setLayers(layers.filter((layer, index) => index !== i));
  };

  const onClickContinue = async () => {
    const configuration = {
      name,
      description,
      symbol,
      width: Number(width),
      height: Number(height),
      generateBackground,
      defaultBackground,
      layers,
    };

    const id = uuid();

    // ! TODO
    try {
      await createFactory(id, configuration, inputDir, outputDir, {
        n,
      });
      await factorySaveInstance(id);
    } catch (error) {
      dialogContext.setDialog("Error", error.message, null, true);
      return;
    }

    navigator("/generation", {
      state: {
        id,
        n,
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
              <Item
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

      <ButtonGroup align="end" marginBottom={8} marginEnd={8}>
        <Button
          variant="cta"
          onPress={onClickContinue}
          isDisabled={!isAbleContinue}
        >
          Continue!
        </Button>
      </ButtonGroup>
    </Flex>
  );
}
