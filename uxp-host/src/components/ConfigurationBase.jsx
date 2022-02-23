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

      <NumberField
        label="N"
        defaultValue={10}
        minValue={1}
        value={n}
        onChange={setN}
      />
      <NumberField label="Width" value={width} onChange={setWidth} />
      <NumberField label="Height" value={height} onChange={setHeight} />

      <Switch
        margin="size-10"
        isSelected={generateBackground}
        onChange={setGenerateBackground}
      >
        Generate Background
      </Switch>

      {/* ! TODO: Switch to a View? */}
      <div>
        <label className="spectrum-FieldLabel">Default Background</label>

        {/* ! TODO: this breaks the code */}
        <ColorPicker
          color={defaultBackground}
          setColor={setDefaultBackground}
          isDisabled={generateBackground}
        />
      </div>

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
