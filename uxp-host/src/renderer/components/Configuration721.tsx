import React from "react";

import { Flex, Heading, NumberField } from "@adobe/react-spectrum";

interface Configuration721Props {
  cost: number;
  setCost: (cost: number) => void;
  maxMintAmount: number;
  setMaxMintAmount: (maxMintAmount: number) => void;
}

export const Configuration721: React.FC<Configuration721Props> = ({
  cost,
  setCost,
  maxMintAmount,
  setMaxMintAmount,
}) => {
  return (
    <Flex direction="column" gap="size-100">
      <Heading>Contract configuration</Heading>
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
};
