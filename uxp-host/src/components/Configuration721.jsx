import React from "react";
import { Flex, TextField, Switch, NumberField } from "@adobe/react-spectrum";

export function Configuration721({
  cost,
  setCost,
  maxMintAmount,
  setMaxMintAmount,
  revealed,
  setRevealed,
  notRevealedUri,
  setNotRevealedUri,
}) {
  return (
    <Flex direction="column">
      <TextField label="Cost" value={cost} onChange={setCost} />
      <NumberField
        label="Max Mint Amount"
        value={maxMintAmount}
        onChange={setMaxMintAmount}
      />

      <Switch margin="size-10" isSelected={revealed} onChange={setRevealed}>
        Revealed?
      </Switch>

      <TextField
        label="Not Revealed File"
        value={notRevealedUri}
        onChange={setNotRevealedUri}
        isDisabled={revealed}
      />
    </Flex>
  );
}
