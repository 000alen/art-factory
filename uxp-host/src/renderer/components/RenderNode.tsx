import React, { memo, useEffect, useState } from "react";
import {
  NumberField,
  Text,
  Flex,
  Heading,
  ActionButton,
  MenuTrigger,
  Menu,
  Item,
} from "@adobe/react-spectrum";
import { ImageItem } from "./ImageItem";
import { DEFAULT_N } from "../constants";
import { Trait } from "../typings";
import { hash } from "../utils";
import {
  Handle,
  Position,
  useEdges,
  useNodes,
  Node as FlowNode,
} from "react-flow-renderer";
import Refresh from "@spectrum-icons/workflow/Refresh";
import { useForceUpdate } from "../hooks/useForceUpdate";
import { getBranches } from "../nodesUtils";
import { LayerNodeComponentData } from "./LayerNode";
import Remove from "@spectrum-icons/workflow/Remove";

export interface RenderNodeComponentData {
  composedUrls?: Record<string, string>;
  renderIds?: Record<string, string>;
  ns?: Record<string, number>;
  ignored?: string[];
  requestComposedUrl?: (traits: Trait[]) => void;
  requestRenderId?: (traits: Trait[]) => void;
  updateNs?: (traits: Trait[], n: number) => void;
  updateIgnored?: (traits: Trait[], ignored: boolean) => void;
}

interface RenderNodeProps {
  id: string;
  data: RenderNodeComponentData;
}

export const RenderNode: React.FC<RenderNodeProps> = memo(({ id, data }) => {
  const [forceUpdate, x] = useForceUpdate();
  const [nodes, edges] = [useNodes(), useEdges()];

  const [cacheKey, setCacheKey] = useState<string>(null);
  const [keys, setKeys] = useState<string[]>([]);
  const [nTraits, setNTraits] = useState<Trait[][]>([]);

  useEffect(() => {
    const nTraits: Trait[][] = (
      getBranches(nodes, edges)
        .filter((branch) => branch[branch.length - 1].id === id)
        .map((branch) =>
          branch.slice(1, -1)
        ) as FlowNode<LayerNodeComponentData>[][]
    )
      .map((branch) => branch.map((node) => node.data))
      .map((branch) =>
        branch.map((data) => ({
          ...data.trait,
          id: data.id,
        }))
      );
    const currentCacheKey = hash(nTraits);

    if (currentCacheKey === cacheKey) return;

    setCacheKey(currentCacheKey);
    setNTraits(nTraits);
  }, [nodes, edges]);

  useEffect(() => {
    if (nTraits.length === 0) return;

    const keys = nTraits.map(hash);

    for (const [i, key] of keys.entries()) {
      if (!(key in data.composedUrls)) data.requestComposedUrl(nTraits[i]);
      if (!(key in data.renderIds)) data.requestRenderId(nTraits[i]);
      if (!(key in data.ns)) data.updateNs(nTraits[i], DEFAULT_N);
    }

    setKeys(keys);
  }, [nTraits]);

  const renderItem = (key: string, i: number) => {
    const renderId = data.renderIds[key];
    const composedUrl = data.composedUrls[key];
    const n = data.ns[key];

    return data.ignored.includes(key) ? (
      <></>
    ) : (
      <Flex direction="column" gap="size-100">
        <ImageItem src={composedUrl} />
        <Heading>{renderId}</Heading>
        <Flex gap="size-100" alignItems="end">
          <NumberField
            width="100%"
            label="N"
            {...{
              value: n,
              onChange: (value: number) => data.updateNs(nTraits[i], value),
            }}
          />
          <ActionButton onPress={() => data.updateIgnored(nTraits[i], true)}>
            <Remove />
          </ActionButton>
        </Flex>
      </Flex>
    );
  };

  const visibleKeys = keys.filter((key) => !data.ignored.includes(key));

  const ignoredKeys = keys.filter((key) => data.ignored.includes(key));
  const ignoredItems = ignoredKeys.map((key) => ({
    id: key,
    name: data.renderIds[key],
  }));

  return (
    <Flex direction="column" gap="size-100">
      <div className="w-48 p-3 border-1 border-dashed border-white rounded opacity-5 hover:opacity-100 transition-all">
        <Flex gap="size-100">
          <MenuTrigger>
            <ActionButton width="100%">Hidden</ActionButton>
            <Menu
              items={ignoredItems}
              selectionMode="single"
              onSelectionChange={(selectedKeys) => {
                const selectedKey = [...selectedKeys].shift() as string;
                data.updateIgnored(nTraits[keys.indexOf(selectedKey)], false);
              }}
            >
              {({ id, name }) => <Item key={id}>{name}</Item>}
            </Menu>
          </MenuTrigger>

          <ActionButton onPress={() => forceUpdate()}>
            <Refresh />
          </ActionButton>
        </Flex>
      </div>

      <div className="relative w-48 p-3 border-1 border-solid border-white rounded">
        <Handle
          className="w-4 h-4 left-0 translate-x-[-50%] translate-y-[-50%]"
          id="renderIn"
          type="target"
          position={Position.Left}
        />

        <Flex direction="column" gap="size-300">
          {visibleKeys.length > 0 ? (
            keys.map(renderItem)
          ) : (
            <div className="h-48 flex justify-center items-center">
              <Text>Nothing to render yet</Text>
            </div>
          )}
        </Flex>
      </div>
    </Flex>
  );
});
