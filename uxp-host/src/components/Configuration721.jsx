import React from "react";
import { Flex, TextField, NumberField } from "@adobe/react-spectrum";

export function Configuration721({
  cost,
  setCost,
  maxMintAmount,
  setMaxMintAmount,
}) {
  return (
    <Flex direction="column">
      {/*<TextField label="Cost" value={cost} onChange={setCost} />*/}
      <NumberField
        label="Cost"
        value={cost}
        onChange={setCost}
        minValue={0.01}
        step={0.01}
      />
      <NumberField
        label="Max Mint Amount"
        value={maxMintAmount}
        onChange={setMaxMintAmount}
      />
    </Flex>
  );
}
