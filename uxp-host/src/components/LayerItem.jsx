import React from "react";
import {
  Flex,
  TextField,
  ActionButton,
} from "@adobe/react-spectrum";

import Remove from "@spectrum-icons/workflow/Remove";

export function LayerItem({ value, index, onChange, onRemove }) {
  return (
    <Flex gap="size-100" justifyContent="space-between">
      <TextField
        aria-label={`Layer ${index}: ${value}`}
        value={value}
        onChange={(_value) => onChange(index, _value)}
      />
      <ActionButton onPress={() => onRemove(index)}>
        <Remove />
      </ActionButton>
    </Flex>
  );
}
