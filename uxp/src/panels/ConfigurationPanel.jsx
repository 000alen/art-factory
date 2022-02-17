import React from "react";

export const ConfigurationPanel = () => {
  return (
    <div className="flex flex-col">
      <sp-textfield>
        <sp-label slot="label">Name</sp-label>
      </sp-textfield>

      <sp-textarea>
        <sp-label slot="label">Description</sp-label>
      </sp-textarea>

      <sp-textfield>
        <sp-label slot="label">Symbol</sp-label>
      </sp-textfield>

      <sp-checkbox>Generate Background</sp-checkbox>

      <sp-textfield>
        <sp-label slot="label">Default Background</sp-label>
      </sp-textfield>

      <div className="flex flex-row">
        <sp-textfield>
          <sp-label slot="label">N</sp-label>
        </sp-textfield>

        <sp-textfield>
          <sp-label slot="label">Width</sp-label>
        </sp-textfield>

        <sp-textfield>
          <sp-label slot="label">Height</sp-label>
        </sp-textfield>
      </div>

      <sp-button variant="cta">Generate!</sp-button>
    </div>
  );
};
