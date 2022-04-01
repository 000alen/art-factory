import React, { memo, useEffect, useState } from "react";
import {
  NumberField,
  Divider,
  Text,
  Flex,
  Heading,
} from "@adobe/react-spectrum";
import { ImageItem } from "./ImageItem";
import { DEFAULT_N, MAX_SIZE } from "../constants";
import { RenderNodeData, Trait } from "../typings";
import { difference, hash } from "../utils";
import { Handle, Position } from "react-flow-renderer";

export interface RenderNodeComponentData extends RenderNodeData {
  readonly factoryId?: string;
  readonly composedUrls?: Map<string, string>;
  readonly renderIds?: Map<string, string>;
  readonly hashes?: Set<string>;
  readonly ns?: Map<string, number>;

  requestComposedUrl?: (traits: Trait[]) => void;
  requestRenderId?: (traits: Trait[]) => void;
  updateHashes?: (hashes: Set<string>) => void;
  updateNs?: (k: string, v: number) => void;
}

interface RenderNodeProps {
  sidebar: boolean;
  id: string;
  data: RenderNodeComponentData;
}

export const RenderNode: React.FC<RenderNodeProps> = memo(
  ({ sidebar, data }) => {
    const [items, setItems] = useState([]);

    useEffect(() => {
      if (data.nTraits.length === 0) return;

      const currentHashes = data.nTraits.map(hash);
      const currentKeys = new Set(currentHashes);
      const traitsByKey = new Map(
        data.nTraits.map((traits, i) => [currentHashes[i], traits])
      );

      const keys = data.hashes;

      const keysToRemove = difference(keys, currentKeys);
      const keysToAdd = difference(currentKeys, keys);

      if (keysToRemove.size === 0 && keysToAdd.size === 0) return;

      const newKeys = difference(keys, keysToRemove);

      for (const key of keysToAdd) {
        const traits = traitsByKey.get(key);
        if (!data.renderIds.has(key)) data.requestRenderId(traits);
        if (!data.composedUrls.has(key)) data.requestComposedUrl(traits);
        if (!data.ns.has(key)) data.updateNs(key, DEFAULT_N);
        newKeys.add(key);
      }

      data.updateHashes(newKeys);
      setItems([...newKeys]);
    }, [data.factoryId, data.nTraits]);

    const renderItem = (item: string, i: number) => {
      const renderId = data.renderIds.get(item);
      const composedUrl = data.composedUrls.get(item);
      const n = data.ns.get(item);

      return (
        <>
          <ImageItem src={composedUrl} />
          <Heading>{renderId}</Heading>
          <NumberField
            label="N"
            {...{
              value: n,
              //   onChange: sidebar
              //     ? null
              //     : (value: number) =>
              //         updateMap(id, { ...map.get(id), n: value }),
              //   isDisabled: sidebar ? true : false,
            }}
          />
          {i !== items.length - 1 && <Divider />}
        </>
      );
    };

    return (
      <div className="w-48 p-3 border-1 border-solid border-white rounded">
        {!sidebar && (
          <Handle
            className="w-4 h-4 left-0 translate-x-[-50%] translate-y-[-50%]"
            id="renderIn"
            type="target"
            position={Position.Left}
          />
        )}
        <Flex direction="column" gap="size-100">
          {items.length > 0 ? (
            items.map(renderItem)
          ) : (
            <div className="h-48 flex justify-center items-center">
              <Text>Nothing to render yet</Text>
            </div>
          )}
        </Flex>
      </div>
    );
  }
);
