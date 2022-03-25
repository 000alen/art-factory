import React, { useContext, useEffect, useState } from "react";
import { NumberField, Text } from "@adobe/react-spectrum";
import { Handle, Position } from "react-flow-renderer";
import { factoryComposeTraits, factoryComputeMaxCombinations } from "../ipc";
import { ImageItem } from "./ImageItem";
import { useErrorHandler } from "./ErrorHandler";
import { MAX_SIZE } from "../constants";
import { LayerNodeData, RenderNodeData, Trait } from "../typings";
import { NodesContext } from "./NodesContext";
import { Handles } from "./Handles";

interface RenderNodeComponentData extends RenderNodeData {
  factoryId: string;
  traits: Trait[];
  base64Strings: string[];
  connected?: boolean;
}

interface RenderNodeProps {
  sidebar: boolean;
  id: string;
  data: RenderNodeComponentData;
}

export const RenderNode: React.FC<RenderNodeProps> = ({
  sidebar,
  id,
  data,
}) => {
  const { onChangeN } = useContext(NodesContext);

  const task = useErrorHandler();
  const [maxN, setMaxN] = useState(null);
  const [url, setUrl] = useState(null);

  const { factoryId, traits, base64Strings, connected } = data;

  useEffect(() => {
    task("preview", async () => {
      if (base64Strings === undefined || base64Strings.length === 0) return;
      if (traits === undefined || traits.length === 0) return;

      const maxN = await factoryComputeMaxCombinations(factoryId, traits);

      const composedBase64String = await factoryComposeTraits(
        factoryId,
        traits,
        MAX_SIZE
      );
      const url = `data:image/png;base64,${composedBase64String}`;

      setMaxN(maxN);
      setUrl(url);
    })();
  }, [data.base64Strings, data.traits]);

  return (
    <div className="p-2 border-2 border-dashed border-white rounded">
      {!sidebar && <Handles name="render" />}
      <div>
        <ImageItem src={connected || sidebar ? url : null} />
        <NumberField
          label={`N ${maxN ? `(max: ${maxN})` : ``}`}
          {...{
            maxValue: maxN,
            value: sidebar ? null : Math.max(1, data.n),
            onChange: sidebar ? null : (value: number) => onChangeN(id, value),
            isDisabled: sidebar ? true : false,
          }}
        />
      </div>
    </div>
  );
};
