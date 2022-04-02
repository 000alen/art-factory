import React, { memo, RefObject } from "react";
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
import Refresh from "@spectrum-icons/workflow/Refresh";
import { useForceUpdate } from "../hooks/useForceUpdate";

export interface LayerNodeComponentData extends LayerNodeData {
  readonly factoryId?: string;
  readonly trait: Trait;
  readonly layersIds?: RefObject<Map<string, string[]>>;
  readonly urls?: RefObject<Map<string, string>>;

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
    const forceUpdate = useForceUpdate();
    const { urls, trait, requestUrl } = data;

    let url;
    if (urls.current.has(hash(trait))) url = urls.current.get(hash(trait));
    else {
      url = null;
      requestUrl(trait);
    }

    // ! TODO NOT UPDATED UNTIL MOVED
    const items = data.layersIds
      ? data.layersIds.current.get(data.name).map((layerId) => ({
          id: layerId,
          name: layerId,
        }))
      : [];

    return (
      <Flex direction="column" gap="size-100">
        <div className="w-48 p-3 border-1 border-dashed border-white rounded opacity-5 hover:opacity-100 transition-all">
          <Flex gap="size-100">
            <MenuTrigger>
              <ActionButton width="100%">{data.layerId}</ActionButton>
              <Menu
                items={items}
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
            <ActionButton onPress={() => forceUpdate()}>
              <Refresh />
            </ActionButton>
          </Flex>
        </div>

        <div className="relative w-48 p-3 border-1 border-solid border-white rounded">
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
          </Flex>
        </div>
      </Flex>
    );
  }
);
