import React, { memo, useEffect, useState } from "react";
import {
  MenuTrigger,
  ActionButton,
  Menu,
  Item,
  Flex,
  Slider,
  Heading,
} from "@adobe/react-spectrum";
import { ImageItem } from "./ImageItem";
import { LayerNodeData, Trait } from "../typings";
import { Handles } from "./Handles";
import { capitalize, hash } from "../utils";

export interface LayerNodeComponentData extends LayerNodeData {
  readonly factoryId?: string;
  readonly trait: Trait;
  readonly layerIds?: string[];
  readonly urls?: Map<string, string>;

  requestUrl?: (trait: Trait) => void;

  onChangeLayerId?: (id: string, value: string) => void;
  onChangeOpacity?: (id: string, value: number) => void;
  onChangeBlending?: (id: string, value: string) => void;
}

interface LayerNodeProps {
  sidebar: boolean;
  id: string;
  data: LayerNodeComponentData;
}

export const LayerNode: React.FC<LayerNodeProps> = memo(
  ({ sidebar, id, data }) => {
    const [url, setUrl] = useState<string | null>(null);

    useEffect(() => {
      const { urls, trait, requestUrl, layerIds } = data;

      if (urls.has(hash(trait))) setUrl(urls.get(hash(trait)));
      else requestUrl(trait);
    });

    return (
      <div className="w-48 p-3 border-1 border-solid border-white rounded">
        {!sidebar && <Handles name="layer" />}

        <Flex direction="column" gap="size-100">
          <ImageItem src={url} />
          <Heading>{data.name}</Heading>
          <Slider
            label="Opacity"
            step={0.01}
            maxValue={1}
            formatOptions={{ style: "percent" }}
            {...{
              value: sidebar ? 1 : data.opacity,
              onChange: sidebar
                ? null
                : (value: number) => data.onChangeOpacity(id, value),
              isDisabled: sidebar ? true : false,
            }}
          />
          <MenuTrigger>
            <ActionButton>{capitalize(data.blending)}</ActionButton>
            <Menu
              selectionMode="single"
              disallowEmptySelection={true}
              selectedKeys={sidebar ? ["normal"] : [data.blending]}
              onSelectionChange={(selectedKeys) =>
                sidebar
                  ? null
                  : data.onChangeBlending(
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
          <MenuTrigger>
            <ActionButton>{data.layerId}</ActionButton>
            <Menu
              items={data.layerIds.map((layerId) => ({
                id: layerId,
                name: layerId,
              }))}
              selectionMode="single"
              disallowEmptySelection={true}
              selectedKeys={sidebar ? null : [data.layerId]}
              onSelectionChange={(selectedKeys) =>
                sidebar
                  ? null
                  : data.onChangeLayerId(
                      id,
                      [...selectedKeys].shift() as string
                    )
              }
            >
              {({ id, name }) => <Item key={id}>{name}</Item>}
            </Menu>
          </MenuTrigger>
        </Flex>
      </div>
    );
  }
);
