import React, { memo, useEffect, useState } from "react";
import {
  Handle,
  Node as FlowNode,
  Position,
  useEdges,
  useNodes,
} from "react-flow-renderer";

import {
  ActionButton,
  Flex,
  Heading,
  Item,
  Menu,
  MenuTrigger,
  NumberField,
  Text,
} from "@adobe/react-spectrum";
import Refresh from "@spectrum-icons/workflow/Refresh";
import Remove from "@spectrum-icons/workflow/Remove";

import { DEFAULT_N } from "../constants";
import { Trait } from "../typings";
import { hash, getBranches } from "../utils";
import { LayerNodeComponentData } from "./LayerNode";

export interface RenderNodeComponentData {
  composedUrls?: Record<string, string>;
  renderIds?: Record<string, string>;
  ns?: Record<string, number>;
  maxNs?: Record<string, number>;
  ignored?: string[];
  requestComposedUrl?: (traits: Trait[]) => void;
  requestRenderId?: (traits: Trait[]) => void;
  requestMaxNs?: (traits: Trait[]) => void;
  updateNs?: (traits: Trait[], n: number) => void;
  updateIgnored?: (traits: Trait[], ignored: boolean) => void;
}

interface RenderNodeProps {
  id: string;
  data: RenderNodeComponentData;
}

interface ImageItemProps {
  name?: string;
  src: string;
}

export const ImageItem: React.FC<ImageItemProps> = ({
  name,
  src,
  children,
}) => {
  return (
    <div className="relative w-full h-full m-auto rounded">
      {children && (
        <div className="absolute w-full h-full space-y-2 flex flex-col bg-gray-600 bg-opacity-75 justify-center items-center opacity-0 hover:opacity-100">
          {children}
        </div>
      )}

      <img
        className="w-full h-full select-none rounded"
        draggable="false"
        src={src}
        alt={name}
      />
    </div>
  );
};

export const RenderNode: React.FC<RenderNodeProps> = memo(({ id, data }) => {
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

    const keys = nTraits.map(hash);

    for (const [i, key] of keys.entries()) {
      if (!(key in data.composedUrls)) data.requestComposedUrl(nTraits[i]);
      if (!(key in data.renderIds)) data.requestRenderId(nTraits[i]);
      if (!(key in data.ns)) data.updateNs(nTraits[i], DEFAULT_N);
      if (!(key in data.maxNs)) data.requestMaxNs(nTraits[i]);
    }

    setCacheKey(currentCacheKey);
    setNTraits(nTraits);
    setKeys(keys);
  }, [nodes, edges]);

  const renderItem = (key: string, i: number) => {
    const renderId = data.renderIds[key];
    const composedUrl = data.composedUrls[key];
    const n = data.ns[key];
    const maxNs = data.maxNs[key];

    return data.ignored.includes(key) ? (
      <></>
    ) : (
      <Flex key={i} direction="column" gap="size-100">
        <ImageItem src={composedUrl}>
          <Text>{nTraits[i].map((trait) => trait.name).join(", ")}</Text>
        </ImageItem>
        <Heading>{renderId}</Heading>
        <Flex gap="size-100" alignItems="end">
          <NumberField
            width="100%"
            minValue={1}
            {...{
              label: `N (max: ${maxNs})`,
              value: n,
              maxValue: maxNs,
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
