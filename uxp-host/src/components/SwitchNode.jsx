import React, { useState } from "react";
import {
  Flex,
  TextField,
  MenuTrigger,
  ActionButton,
  Menu,
  Item,
  Text,
} from "@adobe/react-spectrum";
import { Handle, Position } from "react-flow-renderer";
import { ArrayOf } from "./ArrayOf";
import { ImageItem } from "./ImageItem";
import More from "@spectrum-icons/workflow/More";

export function SwitchNode({ sidebar, data }) {
  const [x, setX] = useState([]);

  const Item = ({ value }) => {
    return (
      <div className="p-2 border-2 border-solid border-white rounded">
        <Flex direction="column">
          <ImageItem src={data.urls[value]} />
          <Flex justifyContent="space-between" alignItems="center">
            <Text>{data.layers[value]}</Text>
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
  };

  return (
    <div className="p-2 border-2 border-solid border-white rounded">
      {!sidebar && (
        <>
          <Handle id="layerIn" type="target" position={Position.Left} />
          <Handle id="layerOut" type="source" position={Position.Right} />
        </>
      )}

      <Flex direction="column">
        <Flex justifyContent="space-between" alignItems="center">
          <ArrayOf
            Component={Item}
            width={null}
            label="Layers"
            emptyValue={0}
            items={x}
            setItems={setX}
          />
        </Flex>
      </Flex>
    </div>
  );
}
