import React from "react";
import { Flex } from "@adobe/react-spectrum";
import { ColorSlider } from "@react-spectrum/color";

export function ColorPicker({ color, setColor, isDisabled }) {
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
