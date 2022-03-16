import React from "react";
import {
  MenuTrigger,
  ActionButton,
  Menu,
  Item,
  Flex,
  Text,
  Slider,
} from "@adobe/react-spectrum";
import { Handle, Position } from "react-flow-renderer";
import { ImageItem } from "./ImageItem";
import More from "@spectrum-icons/workflow/More";

export function LayerNode({ sidebar, data }: { sidebar: boolean; data: any }) {
  const isValidConnection = (connection: any) =>
    connection.targetHandle === "layerIn" ||
    connection.targetHandle === "renderIn";

  return (
    <div className="p-2 border-2 border-solid border-white rounded">
      {!sidebar && (
        <>
          <Handle id="layerIn" type="target" position={Position.Left} />
          <Handle
            id="layerOut"
            type="source"
            position={Position.Right}
            isValidConnection={isValidConnection}
          />
        </>
      )}

      <Flex direction="column" gap="size-100">
        <ImageItem src={data.url} />
        <Text>{data.layer}</Text>
        <Flex justifyContent="space-between" alignItems="center" gap="size-100">
          <Slider
            width="50%"
            label="Opacity"
            step={0.01}
            maxValue={1}
            formatOptions={{ style: "percent" }}
            {...{
              value: sidebar ? 1 : data.opacity,
              onChange: sidebar ? null : data.onChangeOpacity,
              isDisabled: sidebar ? true : false,
            }}
          />
          <MenuTrigger>
            <ActionButton>
              <More />
            </ActionButton>
            <Menu
              selectionMode="single"
              disallowEmptySelection={true}
              // defaultSelectedKeys={["normal"]}
              selectedKeys={sidebar ? ["normal"] : [data.blending]}
              onSelectionChange={(selectedKeys) =>
                sidebar
                  ? null
                  : // @ts-ignore
                    data.onChangeBlending([...selectedKeys].shift())
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
      </Flex>
    </div>
  );
}
