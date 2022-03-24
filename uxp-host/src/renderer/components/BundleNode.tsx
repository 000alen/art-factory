import React from "react";
import { TextField } from "@adobe/react-spectrum";
import { Handle, Position } from "react-flow-renderer";
import { BundleNodeData } from "../typings";

interface BundleNodeProps {
  sidebar: boolean;
  data: any;
}

export const BundleNode: React.FC<BundleNodeProps> = ({ sidebar, data }) => {
  return (
    <div className="p-2 border-2 border-dashed border-white rounded">
      {!sidebar && (
        <>
          <Handle
            className="w-4 h-4 left-0 translate-x-[-50%] translate-y-[-50%]"
            id="bundleIn"
            type="target"
            position={Position.Left}
          />
        </>
      )}
      <div>
        <TextField
          label="Bundle"
          {...{
            value: data.bundle,
            onChange: sidebar ? null : data.onChangeBundle,
            isDisabled: sidebar ? true : false,
          }}
        />
      </div>
    </div>
  );
};
