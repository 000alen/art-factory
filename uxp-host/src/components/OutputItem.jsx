import React from "react";
import { Flex, Text, ActionButton, Heading } from "@adobe/react-spectrum";
import Copy from "@spectrum-icons/workflow/Copy";

export function OutputItem({ title, text, isCopiable }) {
  const onCopy = () => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Flex
      justifyContent="space-between"
      gap="size-100"
      alignItems="baseline"
      width="100%"
    >
      <Flex alignItems="baseline">
        <Heading width="100%">{title}: &nbsp;</Heading>
        <Text UNSAFE_className="break-all">{text}</Text>
      </Flex>

      {isCopiable && (
        <ActionButton onPress={onCopy}>
          <Copy />
        </ActionButton>
      )}
    </Flex>
  );
}
