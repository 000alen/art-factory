import React, { useState } from "react";
import {
  Flex,
  View,
  Text,
  ActionButton,
  TextField,
  NumberField,
} from "@adobe/react-spectrum";
import "@spectrum-css/fieldlabel/dist/index-vars.css";
import Play from "@spectrum-icons/workflow/Play";

export function TaskItem({ task, onRun, fields, children }) {
  const [state, setState] = useState({});

  // {key, type, label}
  const resolveField = (field) => {
    switch (field.type) {
      case "address":
        return (
          <TextField
            key={field.key}
            label={field.label}
            placeholder="0x"
            width="100%"
            onChange={(value) => {
              setState({ ...state, [field.key]: value });
            }}
          />
        );
      case "int":
        return (
          <NumberField
            key={field.key}
            label={field.label}
            onChange={(value) => {
              setState({ ...state, [field.key]: value });
            }}
          />
        );
      case "string":
        return (
          <TextField
            key={field.key}
            label={field.label}
            onChange={(value) => {
              setState({ ...state, [field.key]: value });
            }}
          />
        );
      default:
        break;
    }
  };

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
          <ActionButton onPress={() => onRun && onRun(state)}>
            <Play />
          </ActionButton>
        </Flex>
        {fields && fields.map((field) => resolveField(field))}

        {children}
      </Flex>
    </View>
  );
}
