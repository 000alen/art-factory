import React, { memo, useEffect, useState } from "react";
import { NumberField, Divider, Text } from "@adobe/react-spectrum";
import { factoryComposeTraits, factoryComputeMaxCombinations } from "../ipc";
import { ImageItem } from "./ImageItem";
import { useErrorHandler } from "./ErrorHandler";
import { DEFAULT_N, MAX_SIZE } from "../constants";
import { RenderNodeData, Trait } from "../typings";
import { Handles } from "./Handles";
import { getId, hash } from "../utils";

interface RenderNodeComponentData extends RenderNodeData {
  readonly factoryId: string;
}

interface RenderNodeProps {
  sidebar: boolean;
  id: string;
  data: RenderNodeComponentData;
}

interface CachedItem {
  id: string;
  traits: Trait[];
  n: number;
  url: string;
}

export const RenderNode: React.FC<RenderNodeProps> = memo(
  ({ sidebar, data }) => {
    const task = useErrorHandler();

    const [map, setMap] = useState(new Map<string, CachedItem>());
    const updateMap = (k: string, v: CachedItem) =>
      setMap(new Map(map.set(k, v)));

    useEffect(() => {
      task("render node preview", async () => {
        if (data.nTraits === undefined || data.nTraits.length === 0) return;

        const hashes = data.nTraits.map(hash);
        const hashedTraits = new Map<string, Trait[]>(
          data.nTraits.map((traits, i) => [hashes[i], traits])
        );

        const keys = new Set(map.keys());
        const currentKeys = new Set(hashes);
        const keysToRemove = new Set(
          [...keys].filter((k) => !currentKeys.has(k))
        );
        const keysToAdd = new Set([...currentKeys].filter((k) => !keys.has(k)));

        for (const key of keysToRemove) map.delete(key);

        for (const key of keysToAdd) {
          const id = getId();
          const traits = hashedTraits.get(key);
          const n = DEFAULT_N;
          const url = `data:image/png;base64,${await factoryComposeTraits(
            data.factoryId,
            traits,
            MAX_SIZE
          )}`;

          map.set(key, { id, traits, n, url });
        }

        setMap(new Map(map));
      })();
    }, [data.factoryId, data.nTraits]);

    return (
      <div className="w-48 p-3 border-1 border-solid border-white rounded">
        {!sidebar && <Handles name="render" />}

        <div className="space-y-3">
          {map.size > 0 ? (
            [...map.entries()].map(([id, { n, url }], i) => (
              <>
                <ImageItem key={`image-${id}`} src={url} />
                <NumberField
                  key={`n-${id}`}
                  label="N"
                  {...{
                    value: n,
                    onChange: sidebar
                      ? null
                      : (value: number) =>
                          updateMap(id, { ...map.get(id), n: value }),
                    isDisabled: sidebar ? true : false,
                  }}
                />
                {i !== map.size - 1 && <Divider key={`divider-${id}`} />}
              </>
            ))
          ) : (
            <>
              <div className="h-48 flex justify-center items-center">
                <Text>Nothing to render yet</Text>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }
);
