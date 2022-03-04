import React from "react";

export function ConfigurationBase({
  name,
  setName,
  description,
  setDescription,
  symbol,
  setSymbol,
  generateBackground,
  setGenerateBackground,
  defaultBackground,
  setDefaultBackground,
  contractType,
  setContractType,
}) {
  return (
    <>
      <sp-textfield
        style={{ width: "100%" }}
        value={name}
        onInput={(event) => setName(event.target.value)}
      >
        <sp-label slot="label">Name</sp-label>
      </sp-textfield>

      <sp-textarea
        style={{ width: "100%" }}
        value={description}
        onInput={(event) => setDescription(event.target.value)}
      >
        <sp-label slot="label">Description</sp-label>
      </sp-textarea>

      <sp-textfield
        style={{ width: "100%" }}
        value={symbol}
        onInput={(event) => setSymbol(event.target.value)}
      >
        <sp-label slot="label">Symbol</sp-label>
      </sp-textfield>

      <div className="w-full flex flex-col">
        <sp-checkbox
          style={{ width: "100%" }}
          // checked={generateBackground}
          onClick={(event) => setGenerateBackground(event.target.checked)}
        >
          Generate Background
        </sp-checkbox>

        <sp-textfield
          style={{ width: "100%" }}
          placeholder="#1e1e1e"
          value={defaultBackground}
          onInput={(event) => setDefaultBackground(event.target.value)}
          {...(generateBackground ? { disabled: true } : {})}
        >
          <sp-label slot="label">Default Background</sp-label>
        </sp-textfield>
      </div>

      <div className="w-full flex flex-col">
        <sp-label slot="label">Contract type</sp-label>

        <sp-radio
          value="721"
          onClick={() => setContractType("721")}
          {...(contractType === "721" ? { checked: true } : {})}
        >
          ERC721
        </sp-radio>
        <sp-radio
          value="1155"
          onClick={() => setContractType("1155")}
          {...(contractType === "1155" ? { checked: true } : {})}
        >
          ERC1155
        </sp-radio>
      </div>
    </>
  );
}
