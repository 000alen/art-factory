import React, { memo, useEffect, useState } from "react";
import { useNodes } from "react-flow-renderer";

import {
    ActionButton, Flex, Heading, Item, Menu, MenuTrigger, Slider
} from "@adobe/react-spectrum";

import { Trait } from "../typings";
import { capitalize, hash } from "../utils";
import { Handles } from "./Handles";
import { ImageItem } from "./ImageItem";

export interface LayerNodeComponentData {
  urls?: Record<string, string>;
  requestUrl?: (trait: Trait) => void;
  onChangeLayerId?: (id: string, value: string) => void;
  onChangeLayerOpacity?: (id: string, value: number) => void;
  onChangeLayerBlending?: (id: string, value: string) => void;

  trait: Trait;
  id: string;
  name: string;
  opacity: number;
  blending: string;
}

interface LayerNodeProps {
  id: string;
  data: LayerNodeComponentData;
}

export const LayerNode: React.FC<LayerNodeProps> = memo(({ id, data }) => {
  const nodes = useNodes();

  const [layerIds, setLayerIds] = useState<string[]>([]);
  const [key, setKey] = useState<string>(null);

  useEffect(() => {
    const layerIds = nodes
      .filter((node) => node.type === "layerNode")
      .filter(
        (node) => (node.data as LayerNodeComponentData).name === data.name
      )
      .map((node) => (node.data as LayerNodeComponentData).id);
    setLayerIds(layerIds);
  }, [nodes]);

  useEffect(() => {
    const key = hash(data.trait);

    if (!(key in data.urls)) data.requestUrl(data.trait);

    setKey(key);
  }, [data.trait]);

  const url = data.urls[key];

  const layerIdsItems = layerIds.map((layerId) => ({
    id: layerId,
    name: layerId,
  }));

  return (
    <Flex direction="column" gap="size-100">
      <div className="w-48 p-3 border-1 border-dashed border-white rounded opacity-25 hover:opacity-100 transition-all">
        <MenuTrigger>
          <ActionButton width="100%">{data.id}</ActionButton>
          <Menu
            items={layerIdsItems}
            selectionMode="single"
            disallowEmptySelection={true}
            selectedKeys={[data.id]}
            onSelectionChange={(selectedKeys) =>
              data.onChangeLayerId(id, [...selectedKeys].shift() as string)
            }
          >
            {({ id, name }) => <Item key={id}>{name}</Item>}
          </Menu>
        </MenuTrigger>
      </div>

      <div className="relative w-48 p-3 border-1 border-solid border-white rounded">
        <Handles name="layer" />

        <Flex direction="column" gap="size-100">
          <ImageItem src={url} maxSize={192} />
          <Heading>{data.name}</Heading>
          <Slider
            label="Opacity"
            step={0.01}
            maxValue={1}
            formatOptions={{ style: "percent" }}
            value={data.opacity}
            onChange={(value: number) => data.onChangeLayerOpacity(id, value)}
          />
          <MenuTrigger>
            <ActionButton>{capitalize(data.blending)}</ActionButton>
            <Menu
              selectionMode="single"
              disallowEmptySelection={true}
              selectedKeys={[data.blending]}
              onSelectionChange={(selectedKeys) =>
                data.onChangeLayerBlending(
                  id,
                  [...selectedKeys].shift() as string
                )
              }
            >
              <Item key="normal">Normal</Item>
              <Item key="screen">Screen</Item>
              <Item key="multiply">Multiply</Item>
              <Item key="darken">Darken</Item>
              <Item key="overlay">Overlay</Item>
            </Menu>
          </MenuTrigger>
        </Flex>
      </div>
    </Flex>
  );
});
