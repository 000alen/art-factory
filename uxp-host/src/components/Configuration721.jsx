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
      <TextField label="Cost" value={cost} onChange={setCost} />
      <NumberField
        label="Max Mint Amount"
        value={maxMintAmount}
        onChange={setMaxMintAmount}
      />
    </Flex>
  );
}
