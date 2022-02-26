import React from "react";
import { Handle, Position } from "react-flow-renderer";
import { factoryGetRandomTraitImage } from "../ipc";
import { ImageItem } from "./ImageItem";

export function LayerNode({ data }) {
  return (
    <div className="p-2 border-2 border-solid border-white rounded">
      <Handle id="a" type="target" position={Position.Left} />
      <div>
        <ImageItem src={data.url} />
        <div>{data.layer}</div>
      </div>
      <Handle id="b" type="source" position={Position.Right} />
    </div>
  );
}
