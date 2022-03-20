import React from "react";
import { TextField } from "@adobe/react-spectrum";
import { Handle, Position } from "react-flow-renderer";

interface BundleNodeProps {
  sidebar: boolean;
}

export const BundleNode: React.FC<BundleNodeProps> = ({ sidebar }) => {
  return (
    <div className="p-2 border-2 border-dashed border-white rounded">
      {!sidebar && (
        <>
          <Handle id="bundleIn" type="target" position={Position.Left} />
        </>
      )}
      <div>
        <TextField
          label="Bundle"
          {...{
            isDisabled: sidebar ? true : false,
          }}
        />
      </div>
    </div>
  );
};
