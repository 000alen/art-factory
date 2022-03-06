import { NumberField } from "@adobe/react-spectrum";
import React, { useEffect, useState } from "react";
import { Handle, Position } from "react-flow-renderer";
import { compose } from "../ipc";
import { ImageItem } from "./ImageItem";

export function RenderNode({ sidebar, data }) {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    if (data.buffers) {
      // ! TODO: Pass configuration state
      compose(
        data.buffers.map((buffer) => buffer.buffer),
        { width: 200, height: 200 }
      )
        .then((buffer) => {
          const url = URL.createObjectURL(
            new Blob([buffer], { type: "image/png" })
          );
          setUrl(url);
        })
        // ! TODO: LOL
        .catch((error) => {});
    }
  }, [data]);

  return (
    <div className="p-2 border-2 border-dashed border-white rounded">
      {!sidebar && (
        <Handle id="renderIn" type="target" position={Position.Left} />
      )}
      <div>
        <ImageItem src={url} />
        <NumberField
          label="n"
          {...{
            value: sidebar ? null : Math.max(1, data.n),
            onChange: sidebar ? null : data.onChange,
            isDisabled: sidebar ? true : false,
          }}
        />
      </div>
    </div>
  );
}
