import { NumberField } from "@adobe/react-spectrum";
import React, { useEffect, useState } from "react";
import { Handle, Position } from "react-flow-renderer";
import { compose } from "../ipc";
import { ImageItem } from "./ImageItem";

export function RenderNode({ data }) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    if (data.buffers) {
      compose(...data.buffers.map((buffer) => buffer.buffer)).then((buffer) => {
        const url = URL.createObjectURL(
          new Blob([buffer], { type: "image/png" })
        );

        setUrl(url);
      });
    }
  }, [data.buffers]);

  return (
    <div className="p-2 border-2 border-solid border-white rounded">
      <Handle id="a" type="target" position={Position.Left} />
      <div>
        <ImageItem src={url} />
        <NumberField label="n" />
      </div>
    </div>
  );
}
