import React, { useEffect, useState } from "react";
import { NumberField } from "@adobe/react-spectrum";
import { Handle, Position } from "react-flow-renderer";
import { compose } from "../ipc";
import { ImageItem } from "./ImageItem";
import { useErrorHandler } from "./ErrorHandler";

interface RenderNodeProps {
  sidebar: boolean;
  data: any;
}

export const RenderNode: React.FC<RenderNodeProps> = ({ sidebar, data }) => {
  const task = useErrorHandler();
  const [url, setUrl] = useState(null);

  const { connected, buffers } = data;

  useEffect(() => {
    task("preview", async () => {
      if (data.buffers === undefined || data.buffers.length === 0) return;

      const composedBuffer = await compose(
        buffers.map((buffer: Buffer) => buffer.buffer),
        { width: 200, height: 200 }
      );
      const url = URL.createObjectURL(
        new Blob([composedBuffer as BlobPart], { type: "image/png" })
      );

      setUrl(url);
    })();
  }, [data.buffers]);

  return (
    <div className="p-2 border-2 border-dashed border-white rounded">
      {!sidebar && (
        <>
          <Handle id="renderIn" type="target" position={Position.Left} />
          <Handle id="renderOut" type="source" position={Position.Right} />
        </>
      )}
      <div>
        <ImageItem src={connected || sidebar ? url : null} />
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
};
