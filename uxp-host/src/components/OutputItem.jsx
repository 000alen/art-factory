import React from "react";
import { Flex, Text, ActionButton } from "@adobe/react-spectrum";
import Copy from "@spectrum-icons/workflow/Copy";

export function OutputItem({ text, isCopiable }) {
  return (
    <Flex justifyContent="space-between">
      <Text>{text}</Text>
      {isCopiable && (
        <ActionButton>
          <Copy />
        </ActionButton>
      )}
    </Flex>
  );
}
