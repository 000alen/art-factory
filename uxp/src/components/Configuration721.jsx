import React from "react";

export function Configuration721({
  cost,
  setCost,
  maxMintAmount,
  setMaxMintAmount,
}) {
  return (
    <>
      <sp-textfield
        style={{ width: "100%" }}
        placeholder="0.05"
        value={cost}
        onInput={(event) => setCost(event.target.value)}
      >
        <sp-label slot="label">Cost</sp-label>
      </sp-textfield>
      <sp-textfield
        style={{ width: "100%" }}
        placeholder="10"
        value={maxMintAmount}
        onInput={(event) => setMaxMintAmount(event.target.value)}
      >
        <sp-label slot="label">Max mint amount</sp-label>
      </sp-textfield>
    </>
  );
}
