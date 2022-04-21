import React from "react";

import { Flex, Heading, NumberField } from "@adobe/react-spectrum";

interface Configuration721_reveal_pauseProps {
  // cost: number;
  // setCost: (cost: number) => void;
  // maxMintAmount: number;
  // setMaxMintAmount: (maxMintAmount: number) => void;
}

export const Configuration721_reveal_pause: React.FC<
  Configuration721_reveal_pauseProps
> = ({
  // cost,
  // setCost,
  // maxMintAmount,
  // setMaxMintAmount,
}) => {
  return (
    <Flex direction="column" gap="size-100">
      <Heading>ERC721_reveal_pause configuration</Heading>
      {/* <NumberField
        label="Cost"
        value={cost}
        onChange={setCost}
        minValue={0.01}
        step={0.01}
      /> */}
      {/* <NumberField
        label="Max Mint Amount"
        value={maxMintAmount}
        onChange={setMaxMintAmount}
      /> */}
    </Flex>
  );
};
