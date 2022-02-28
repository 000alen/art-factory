import React from "react";
import { Handle, Position } from "react-flow-renderer";
import { ImageItem } from "./ImageItem";

export function LayerNode({ sidebar, data }) {
  const isValidConnection = (connection) =>
    connection.targetHandle === "layerIn" ||
    connection.targetHandle === "renderIn";

  return (
    <div className="p-2 border-2 border-solid border-white rounded">
      {!sidebar && (
        <Handle id="layerIn" type="target" position={Position.Left} />
      )}
      <div>
        <ImageItem src={data.url} />
        <div>{data.layer}</div>
      </div>
      {!sidebar && (
        <Handle
          id="layerOut"
          type="source"
          position={Position.Right}
          isValidConnection={isValidConnection}
        />
      )}
    </div>
  );
}
