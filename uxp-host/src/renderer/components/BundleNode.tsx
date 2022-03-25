import React, { useContext } from "react";
import { TextField } from "@adobe/react-spectrum";
import { Handle, Position } from "react-flow-renderer";
import { BundleNodeData } from "../typings";
import { NodesContext } from "./NodesContext";

interface BundleNodeComponentData extends BundleNodeData {}

interface BundleNodeProps {
  sidebar: boolean;
  id: string;
  data: BundleNodeComponentData;
}

export const BundleNode: React.FC<BundleNodeProps> = ({
  sidebar,
  id,
  data,
}) => {
  const { onChangeBundle } = useContext(NodesContext);

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
            onChange: sidebar
              ? null
              : (value: string) => onChangeBundle(id, value),
            isDisabled: sidebar ? true : false,
          }}
        />
      </div>
    </div>
  );
};
