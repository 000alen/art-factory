import React from "react";
import { Flex, TextField, 
  // ActionGroup, 
  Item, 
  ActionGroup} from "@adobe/react-spectrum";

import Remove from "@spectrum-icons/workflow/Remove";
import ChevronUp from "@spectrum-icons/workflow/ChevronUp";
import ChevronDown from "@spectrum-icons/workflow/ChevronDown";

interface LayerItemProps {
  value: string;
  index: number;
  onChange: (index: number, value: string) => void;
  onMoveDown: (index: number) => void;
  onMoveUp: (index: number) => void;
  onRemove: (index: number) => void;
}

export const LayerItem: React.FC<LayerItemProps> = ({
  value,
  index,
  onChange,
  onMoveDown,
  onMoveUp,
  onRemove,
}) => {
  const onAction = (action: string) => {
    switch (action) {
      case "moveDown":
        onMoveDown(index);
        break;
      case "moveUp":
        onMoveUp(index);
        break;
      case "remove":
        onRemove(index);
        break;
      default:
        break;
    }
  };

  return (
    <Flex gap="size-100" justifyContent="space-between">
      <TextField
        width="100%"
        aria-label={`Layer ${index}: ${value}`}
        value={value}
        onChange={(_value) => onChange(index, _value)}
      />
      <ActionGroup overflowMode="collapse" onAction={onAction}>
        <Item key="moveDown">
          <ChevronDown />
        </Item>
        <Item key="moveUp">
          <ChevronUp />
        </Item>
        <Item key="remove">
          <Remove />
        </Item>
      </ActionGroup>
    </Flex>
  );
};
