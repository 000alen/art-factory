import React from "react";
import { Handle, Position } from "react-flow-renderer";
import { Text } from "@adobe/react-spectrum";

export function RootNode({ sidebar }: { sidebar: boolean }) {
  const isValidConnection = (connection: any) =>
    connection.targetHandle === "layerIn";

  return (
    <div className="w-32 h-32 p-2 border-2 border-dashed border-white rounded-full">
      {!sidebar && (
        <Handle
          id="renderOut"
          type="source"
          position={Position.Right}
          isValidConnection={isValidConnection}
        />
      )}
      <div className="w-full h-full flex justify-center items-center select-none">
        <Text>Root</Text>
      </div>
    </div>
  );
}
