import React, { memo } from "react";
import { TextField } from "@adobe/react-spectrum";
import { Handle, Position } from "react-flow-renderer";
import { BundleNodeData } from "../typings";

interface BundleNodeComponentData extends BundleNodeData {
  readonly factoryId: string;
  readonly bundleId: string;

  onChangeBundle?: (id: string, value: string) => void;
}

interface BundleNodeProps {
  sidebar: boolean;
  id: string;
  data: BundleNodeComponentData;
}

export const BundleNode: React.FC<BundleNodeProps> = memo(
  ({ sidebar, id, data }) => {
    return (
      <div className="w-48 p-3 border-1 border-dashed border-white rounded">
        {!sidebar && (
          <Handle
            className="w-4 h-4 left-0 translate-x-[-50%] translate-y-[-50%]"
            id="bundleIn"
            type="target"
            position={Position.Left}
          />
        )}
        <div>
          <TextField
            label="Bundle"
            {...{
              value: data.bundle,
              onChange: sidebar
                ? null
                : (value: string) => data.onChangeBundle(id, value),
              isDisabled: sidebar ? true : false,
            }}
          />
        </div>
      </div>
    );
  }
);
