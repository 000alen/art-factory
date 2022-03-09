import React from "react";
import {
  MenuTrigger,
  ActionButton,
  Menu,
  Item,
  Flex,
  Text,
} from "@adobe/react-spectrum";
import { Handle, Position } from "react-flow-renderer";
import { ImageItem } from "./ImageItem";
import More from "@spectrum-icons/workflow/More";

export function LayerNode({ sidebar, data }) {
  const isValidConnection = (connection) =>
    connection.targetHandle === "layerIn" ||
    connection.targetHandle === "renderIn";

  console.log(data);

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

      <Flex direction="column">
        <ImageItem src={data.url} />
        <Flex justifyContent="space-between" alignItems="center">
          <Text>{data.layer}</Text>
          <MenuTrigger>
            <ActionButton>
              <More />
            </ActionButton>
            <Menu
              selectionMode="single"
              disallowEmptySelection={true}
              defaultSelectedKeys={["normal"]}
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
