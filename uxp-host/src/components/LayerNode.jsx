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

  return (
    <div className="p-2 border-2 border-solid border-white rounded">
      {!sidebar && (
        <Handle id="layerIn" type="target" position={Position.Left} />
      )}

      <Flex direction="column">
        <ImageItem src={data.url} />
        <Flex justifyContent="space-between" alignItems="center">
          <Text>{data.layer}</Text>
          <MenuTrigger>
            <ActionButton>
              <More />
            </ActionButton>
            <Menu onAction={(key) => alert(key)}>
              <Item>Normal</Item>
              <Item>Screen</Item>
              <Item>Multiply</Item>
              <Item>Darken</Item>
              <Item>Overlay</Item>
            </Menu>
          </MenuTrigger>
        </Flex>
      </Flex>

      {!sidebar && (
        <Handle
          id="layerOut"
          type="source"
          position={Position.Right}
          isValidConnection={isValidConnection}
        />
      )}
    </div>
  );
}
