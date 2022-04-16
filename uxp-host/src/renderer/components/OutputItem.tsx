import React from "react";

import { ActionButton, Flex, Heading, Text } from "@adobe/react-spectrum";
import Copy from "@spectrum-icons/workflow/Copy";

interface OutputItemProps {
  title: string;
  text: string;
  isCopiable: boolean;
}

export const OutputItem: React.FC<OutputItemProps> = ({
  title,
  text,
  isCopiable,
}) => {
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
};
