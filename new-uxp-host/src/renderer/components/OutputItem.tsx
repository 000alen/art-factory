import React from "react";
import { Flex, Text, ActionButton, Heading } from "@adobe/react-spectrum";
import Copy from "@spectrum-icons/workflow/Copy";

export function OutputItem({
  title,
  text,
  isCopiable,
}: {
  title: string;
  text: string;
  isCopiable: boolean;
}) {
  const onCopy = () => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Flex
      width="100%"
      gap="size-100"
      alignItems="end"
      justifyContent="space-between"
    >
      <Flex direction="column">
        <Heading width="100%" marginBottom={-2}>
          {title}: &nbsp;
        </Heading>
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
