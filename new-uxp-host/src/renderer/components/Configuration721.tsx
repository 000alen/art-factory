import React from "react";
import { Flex, NumberField } from "@adobe/react-spectrum";

interface Configuration721Props {
  cost: number;
  setCost: (cost: number) => void;
  maxMintAmount: number;
  setMaxMintAmount: (maxMintAmount: number) => void;
}

export function Configuration721({
  cost,
  setCost,
  maxMintAmount,
  setMaxMintAmount,
}: Configuration721Props) {
  return (
    <Flex direction="column" gap="size-100">
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
