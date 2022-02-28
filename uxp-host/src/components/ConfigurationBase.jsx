import React from "react";
import {
  Flex,
  TextField,
  NumberField,
  Switch,
  TextArea,
  RadioGroup,
  Radio,
} from "@adobe/react-spectrum";
import { ColorPicker } from "./ColorPicker";

export function ConfigurationBase({
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
}) {
  return (
    <Flex direction="column">
      <TextField label="Name" value={name} onChange={setName} />
      <TextArea
        label="Description"
        value={description}
        onChange={setDescription}
      />

      <TextField label="Symbol" value={symbol} onChange={setSymbol} />
      <NumberField label="Width" value={width} onChange={setWidth} />
      <NumberField label="Height" value={height} onChange={setHeight} />

      <Switch
        margin="size-10"
        isSelected={generateBackground}
        onChange={setGenerateBackground}
      >
        Generate Background
      </Switch>

      <ColorPicker
        label="Default Background"
        color={defaultBackground}
        setColor={setDefaultBackground}
        isDisabled={generateBackground}
      />

      <RadioGroup
        label="Contract type"
        value={contractType}
        onChange={setContractType}
      >
        <Radio value="721">ERC721</Radio>
        <Radio value="1155">ERC1155</Radio>
      </RadioGroup>
    </Flex>
  );
}
