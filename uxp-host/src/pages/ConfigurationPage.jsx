import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Button,
  View,
  Flex,
  Heading,
  TextField,
  Switch,
  ActionButton,
} from "@adobe/react-spectrum";

import Add from "@spectrum-icons/workflow/Add";
import Remove from "@spectrum-icons/workflow/Remove";

export function ConfigurationPage() {
  const navigator = useNavigate();
  const { state } = useLocation();
  const { inputDir, outputDir } = state;

  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
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

  const onClickRemoveLayer = () => {
    if (layers.length > 1) {
      setLayers(layers.slice(0, layers.length - 1));
    }
  };

  const onClickContinue = () => {
    navigator("/generation", {
      state: {
        inputDir,
        outputDir,
        configuration: {
          name,
          symbol,
          width: Number(width),
          height: Number(height),
          generateBackground,
          defaultBackground,
          layers,
        },
      },
    });
  };

  return (
    <View marginX="size-250" gap="size-100" justifyContent="center">
      <Heading level={2} marginBottom={-2} alignSelf="center">
        Collection configuration
      </Heading>

      <Flex direction="row" alignSelf="center" gap="size-600">
        <Flex direction="column">
          <Heading> General configuration </Heading>
          <TextField label="Name" value={name} onChange={setName} />
          <TextField label="Symbol" value={symbol} onChange={setSymbol} />
          <TextField label="Width" value={width} onChange={setWidth} />
          <TextField label="Height" value={height} onChange={setHeight} />

          <Switch
            margin="size-10"
            isSelected={generateBackground}
            onChange={setGenerateBackground}
          >
            Generate Background
          </Switch>

          <TextField
            label="Default Background"
            value={defaultBackground}
            onChange={setDefaultBackground}
            isDisabled={generateBackground}
          />
        </Flex>
        <Flex
          direction="column"
          gap="size-100"
          height="size-500"
          overflow="hidden visible"
        >
          <Heading> Layers configuration </Heading>

          <Flex direction="column" gap="size-100">
            {layers.map((layer, index) => (
              <TextField
                key={index}
                aria-label={`Layer ${index + 1}`}
                value={layer}
                onChange={(value) => onEditLayer(index, value)}
              />
            ))}
          </Flex>

          <Flex>
            <ActionButton aria-label="Icon only" onPress={onClickAddLayer}>
              <Add />
            </ActionButton>
            <ActionButton aria-label="Icon only" onPress={onClickRemoveLayer}>
              <Remove />
            </ActionButton>
          </Flex>
        </Flex>
      </Flex>

      <Button
        variant="cta"
        marginTop="size-250"
        onPress={onClickContinue}
        isDisabled={!isAbleContinue}
      >
        Continue!
      </Button>
    </View>
  );
}
