import React from "react";
import { Handle, Position } from "react-flow-renderer";

interface HandlesProps {
  name: string;
}

export const Handles: React.FC<HandlesProps> = ({ name }) => {
  return (
    <>
      <Handle
        className="w-4 h-4 left-0 translate-x-[-50%] translate-y-[-50%]"
        id={`${name}In`}
        type="target"
        position={Position.Left}
      />
      <Handle
        className="w-4 h-4 right-0 translate-x-[50%] translate-y-[-50%]"
        id={`${name}Out`}
        type="source"
        position={Position.Right}
      />
    </>
  );
};
