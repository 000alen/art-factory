import React from "react";
import { Handle, Position } from "react-flow-renderer";
import { Text } from "@adobe/react-spectrum";

interface RootNodeProps {
  sidebar: boolean;
}

export const RootNode: React.FC<RootNodeProps> = ({ sidebar }) => {
  const isValidConnection = (connection: any) =>
    connection.targetHandle === "layerIn";

  return (
    <div className="w-32 h-32 p-2 border-2 border-dashed border-white rounded-full">
      {!sidebar && (
        <Handle
          className="w-4 h-4 right-0 translate-x-[50%] translate-y-[-50%]"
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
};
