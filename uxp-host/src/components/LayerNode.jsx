import React, { useEffect, useState } from "react";
import { Handle, Position } from "react-flow-renderer";
import { factoryGetRandomTraitImage } from "../ipc";
import { ImageItem } from "./ImageItem";

export function LayerNode({ data }) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    factoryGetRandomTraitImage(data.id, data.layer).then((buffer) =>
      setUrl(URL.createObjectURL(new Blob([buffer], { type: "image/png" })))
    );
  }, []);

  return (
    <div className="p-2 border-2 border-solid border-white rounded">
      <Handle id="a" type="target" position={Position.Left} />
      <div>
        <ImageItem src={url} />
        <div>{data.layer}</div>
      </div>
      <Handle id="b" type="source" position={Position.Right} />
    </div>
  );
}
