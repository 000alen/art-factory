import React from "react";
import { Flex } from "@adobe/react-spectrum";
import { ColorSlider } from "@react-spectrum/color";
import "@spectrum-css/fieldlabel/dist/index-vars.css";

interface ColorPickerProps {
  label: string;
  color: string;
  setColor: (color: any) => void;
  isDisabled?: boolean;
}

export function ColorPicker({
  label,
  color,
  setColor,
  isDisabled,
}: ColorPickerProps) {
  return (
    <Flex direction="column">
      <label className="spectrum-FieldLabel">{label}</label>
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
        // @ts-ignore
        onChange={setColor}
      />
      <ColorSlider
        isDisabled={isDisabled}
        channel="blue"
        value={color}
        // @ts-ignore
        onChange={setColor}
      />
      {/* <ColorSlider
        isDisabled={isDisabled}
        channel="alpha"
        value={color}
        onChange={setColor}
      /> */}
    </Flex>
  );
}
