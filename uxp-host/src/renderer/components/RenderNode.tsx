import React, { useEffect, useState } from "react";
import { NumberField } from "@adobe/react-spectrum";
import { Handle, Position } from "react-flow-renderer";
import { factoryComposeTraits } from "../ipc";
import { ImageItem } from "./ImageItem";
import { useErrorHandler } from "./ErrorHandler";
import { MAX_SIZE } from "../constants";

interface RenderNodeProps {
  sidebar: boolean;
  data: any;
}

export const RenderNode: React.FC<RenderNodeProps> = ({ sidebar, data }) => {
  const task = useErrorHandler();
  const [url, setUrl] = useState(null);

  const { factoryId, traits, base64Strings, connected } = data;

  useEffect(() => {
    task("preview", async () => {
      if (base64Strings === undefined || base64Strings.length === 0) return;
      if (traits === undefined || traits.length === 0) return;

      const composedBase64String = await factoryComposeTraits(
        factoryId,
        traits,
        MAX_SIZE
      );
      const url = `data:image/png;base64,${composedBase64String}`;

      setUrl(url);
    })();
  }, [data.base64Strings, data.traits]);

  return (
    <div className="p-2 border-2 border-dashed border-white rounded">
      {!sidebar && (
        <>
          <Handle
            className="w-4 h-4 left-0 translate-x-[-50%] translate-y-[-50%]"
            id="renderIn"
            type="target"
            position={Position.Left}
          />
          <Handle
            className="w-4 h-4 right-0 translate-x-[50%] translate-y-[-50%]"
            id="renderOut"
            type="source"
            position={Position.Right}
          />
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
