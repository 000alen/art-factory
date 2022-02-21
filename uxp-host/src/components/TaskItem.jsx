import React from "react";
import { Flex, View, Text, ActionButton } from "@adobe/react-spectrum";
import "@spectrum-css/fieldlabel/dist/index-vars.css";
import Play from "@spectrum-icons/workflow/Play";

export function TaskItem({ task, onRun, children }) {
  return (
    <View
      borderWidth="thin"
      borderColor="dark"
      borderRadius="medium"
      padding="size-100"
    >
      <Flex direction="column" gap="size-100">
        <Flex alignItems="center" justifyContent="space-between">
          <Text>{task}</Text>
          <ActionButton onPress={onRun}>
            <Play />
          </ActionButton>
        </Flex>
        {children}
      </Flex>
    </View>
  );
}
