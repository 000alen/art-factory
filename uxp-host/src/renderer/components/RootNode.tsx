import React, { memo } from "react";
import { Handle, Position } from "react-flow-renderer";

import { Text } from "@adobe/react-spectrum";

export const RootNode: React.FC = memo(() => {
  return (
    <div className="w-32 h-32 p-2 border-1 border-dashed border-white rounded-full">
      <Handle
        className="!w-4 !h-4 !right-0 !translate-x-[50%] !translate-y-[-50%]"
        id="renderOut"
        type="source"
        position={Position.Right}
      />
      <div className="w-full h-full flex justify-center items-center select-none">
        <Text>Root</Text>
      </div>
    </div>
  );
});
