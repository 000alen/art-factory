import React from "react";

import { ActionButton, Flex, Item, Menu, MenuTrigger, TextField } from "@adobe/react-spectrum";

import { METADATA_FIELDS } from "../constants";

interface MetadataFieldProps {
  value: { key: string; value: string };
  onChange: (value: { key: string; value: string }) => void;
}

export const MetadataField: React.FC<MetadataFieldProps> = ({
  value,
  onChange,
}) => {
  const { key: k, value: v } = value;

  const items = METADATA_FIELDS.map((field) => ({
    id: field,
    name: field,
  }));

  return (
    <Flex gap="size-100" width="100%">
      <MenuTrigger>
        <ActionButton width="50%">{k}</ActionButton>
        <Menu
          items={items}
          selectionMode="single"
          disallowEmptySelection={true}
          selectedKeys={[k]}
          onSelectionChange={(selectedKeys) =>
            onChange({ key: [...selectedKeys].shift() as string, value: v })
          }
        >
          {({ id, name }) => <Item key={id}>{name}</Item>}
        </Menu>
      </MenuTrigger>
      {":"}
      <TextField
        width="100%"
        value={v}
        onChange={(v: string) => onChange({ key: k, value: v })}
      />
    </Flex>
  );
};
