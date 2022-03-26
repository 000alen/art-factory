import React, { useContext } from "react";
import {
  MenuTrigger,
  ActionButton,
  Menu,
  Item,
  Flex,
  Text,
  Slider,
  Heading,
} from "@adobe/react-spectrum";
import { Handle, Position } from "react-flow-renderer";
import { ImageItem } from "./ImageItem";
import More from "@spectrum-icons/workflow/More";
import { v4 as uuid } from "uuid";
import { LayerNodeData } from "../typings";
import { NodesContext } from "./NodesContext";
import { Handles } from "./Handles";
import { capitalize } from "../utils";

interface LayerNodeComponentData extends LayerNodeData {
  layerIds: string[];
  base64String: string;
}

interface LayerNodeProps {
  sidebar: boolean;
  id: string;
  data: LayerNodeComponentData;
}

export const LayerNode: React.FC<LayerNodeProps> = ({ sidebar, id, data }) => {
  const { onChangeLayerId, getLayerIds, onChangeOpacity, onChangeBlending } =
    useContext(NodesContext);

  return (
    <div className="p-3 border-2 border-solid border-white rounded">
      {!sidebar && <Handles name="layer" />}

      <Flex direction="column" gap="size-100">
        <ImageItem
          src={
            data.base64String
              ? `data:image/png;base64,${data.base64String}`
              : null
          }
        />
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
              : (value: number) => onChangeOpacity(id, value),
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
                : onChangeBlending(id, [...selectedKeys].shift() as string)
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
            selectionMode="single"
            disallowEmptySelection={true}
            selectedKeys={sidebar ? null : [data.layerId]}
            onSelectionChange={(selectedKeys) =>
              sidebar
                ? null
                : onChangeLayerId(id, [...selectedKeys].shift() as string)
            }
          >
            {getLayerIds(data.name).map((layerId) => (
              <Item key={layerId}>{layerId}</Item>
            ))}
          </Menu>
        </MenuTrigger>
      </Flex>
    </div>
  );
};
