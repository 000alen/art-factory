import React from "react";
import { Item, ListBox } from "@adobe/react-spectrum";

interface ConfigurationLayersProps {
  availableLayers: string[];
  layers: string[];
  setLayers: (layers: string[]) => void;
}

export const ConfigurationLayers: React.FC<ConfigurationLayersProps> = ({
  availableLayers,
  layers,
  setLayers,
}) => {
  const items = availableLayers.map((layer) => ({
    name: layer,
  }));

  return (
    <ListBox
      width="size-2400"
      selectionMode="multiple"
      aria-label="Pick an animal"
      items={items}
      defaultSelectedKeys={layers}
      onSelectionChange={(selectedKeys) =>
        setLayers([...selectedKeys] as string[])
      }
    >
      {(item) => <Item key={item.name}>{item.name}</Item>}
    </ListBox>
  );
};
