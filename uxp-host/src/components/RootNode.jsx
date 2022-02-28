import React from "react";
import { Handle, Position } from "react-flow-renderer";
import { Text } from "@adobe/react-spectrum";

export function RootNode({ sidebar }) {
  return (
    <div className="w-12 h-12 p-2 border-2 border-dashed border-white rounded-full">
      {!sidebar && <Handle id="a" type="source" position={Position.Right} />}
      <div className="w-full h-full flex justify-center items-center select-none">
        <Text>Root</Text>
      </div>
    </div>
  );
}
