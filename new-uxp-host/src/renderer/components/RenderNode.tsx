import React, { useEffect, useState } from "react";
import { NumberField } from "@adobe/react-spectrum";
import { Handle, Position } from "react-flow-renderer";
import { compose } from "../ipc";
import { ImageItem } from "./ImageItem";

export function RenderNode({ sidebar, data }: { sidebar: boolean; data: any }) {
  const [url, setUrl] = useState(null);

  const { connected, buffers } = data;

  useEffect(() => {
    if (data.buffers) {
      // ! TODO: Pass configuration state
      compose(
        // @ts-ignore
        buffers.map((buffer) => buffer.buffer),
        { width: 200, height: 200 }
      )
        .then((buffer) => {
          const url = URL.createObjectURL(
            // @ts-ignore
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
        <>
          <Handle id="renderIn" type="target" position={Position.Left} />
          <Handle id="bundleIn" type="target" position={Position.Top} />
          <Handle id="bundleOut" type="source" position={Position.Bottom} />
        </>
      )}
      <div>
        {/* ! TODO: Placeholder */}
        <ImageItem src={connected || sidebar ? url : null} />{" "}
        <NumberField
          label="n"
          {...{
            value: sidebar ? null : Math.max(1, data.n),
            onChange: sidebar ? null : data.onChangeN,
            isDisabled: sidebar ? true : false,
          }}
        />
      </div>
    </div>
  );
}
