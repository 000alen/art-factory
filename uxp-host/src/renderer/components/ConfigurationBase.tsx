import React from "react";

import {
    Flex, NumberField, Radio, RadioGroup, Slider, Switch, TextArea, TextField
} from "@adobe/react-spectrum";

import { ContractType } from "../typings";
import { ColorPicker } from "./ColorPicker";

interface ConfigurationBaseProps {
  name: string;
  setName: (name: string) => void;
  description: string;
  setDescription: (description: string) => void;
  symbol: string;
  setSymbol: (symbol: string) => void;
  originalWidth: number;
  originalHeight: number;
  width: number;
  setWidth: (width: number) => void;
  height: number;
  setHeight: (height: number) => void;
  generateBackground: boolean;
  setGenerateBackground: (generateBackground: boolean) => void;
  defaultBackground: any;
  setDefaultBackground: (defaultBackground: any) => void;
  contractType: ContractType;
  setContractType: (contractType: ContractType) => void;
}

export const ConfigurationBase: React.FC<ConfigurationBaseProps> = ({
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
}) => {
  const onResolutionChange = (value: number) => {
    setWidth(Math.floor(originalWidth * (value / 100)));
    setHeight(Math.floor(originalHeight * (value / 100)));
  };

  return (
    <Flex direction="column" gap="size-100">
      <TextField label="Name" value={name} onChange={setName} />
      <TextArea
        label="Description"
        value={description}
        onChange={setDescription}
      />

      <TextField label="Symbol" value={symbol} onChange={setSymbol} />

      <Flex direction="column">
        <Slider
          label="Resolution"
          defaultValue={100}
          minValue={10}
          maxValue={100}
          onChange={onResolutionChange}
        />

        <NumberField
          label="Width"
          value={width}
          onChange={setWidth}
          isReadOnly
        />
        <NumberField
          label="Height"
          value={height}
          onChange={setHeight}
          isReadOnly
        />
      </Flex>

      <Switch isSelected={generateBackground} onChange={setGenerateBackground}>
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
        <Radio value="721_reveal_pause">ERC721_reveal_pause</Radio>
      </RadioGroup>
    </Flex>
  );
};
