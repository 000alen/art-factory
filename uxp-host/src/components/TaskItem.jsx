import React, { useState } from "react";
import {
  Flex,
  View,
  Text,
  ActionButton,
  TextField,
  NumberField,
  DialogTrigger,
  Dialog,
  Content,
  ButtonGroup,
  Button,
  Heading,
  Divider,
} from "@adobe/react-spectrum";
import "@spectrum-css/fieldlabel/dist/index-vars.css";
import Play from "@spectrum-icons/workflow/Play";
import ShowMenu from "@spectrum-icons/workflow/ShowMenu";

import { ActionGroup, Item } from "@adobe/react-spectrum";

import Remove from "@spectrum-icons/workflow/Remove";
import ChevronUp from "@spectrum-icons/workflow/ChevronUp";
import ChevronDown from "@spectrum-icons/workflow/ChevronDown";
import { ArrayOf } from "./ArrayOf";

const TaskDialog = ({ task, onHideDialog, onRun, fields, resolveField }) => {
  return (
    <Dialog>
      <Heading>{task}</Heading>
      <Divider />

      <Content>
        <Flex direction="column" gap="size-100">
          {fields && fields.map((field) => resolveField(field))}
        </Flex>
      </Content>

      <ButtonGroup>
        <Button onPress={onHideDialog}>Close</Button>
        <Button variant="cta" onPress={() => onRun && onRun()}>
          Run
        </Button>
      </ButtonGroup>
    </Dialog>
  );
};

export function TaskItem({ task, onRun, fields, dialog }) {
  const [state, setState] = useState({});
  const [dialogShown, setDialogShown] = useState(false);

  const onSet = (key, value) => {
    setState({ ...state, [key]: value });
  };

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
            onChange={(value) => onSet(field.key, value)}
          />
        );
      case "int":
        return (
          <NumberField
            key={field.key}
            label={field.label}
            onChange={(value) => onSet(field.key, value)}
          />
        );
      case "string":
        return (
          <TextField
            key={field.key}
            label={field.label}
            onChange={(value) => onSet(field.key, value)}
          />
        );
      case "address[]":
        const addresses = state[field.key] || [""];

        return (
          <ArrayOf
            Component={TextField}
            props={{ placeholder: "0x" }}
            label={field.label}
            emptyValue=""
            items={addresses}
            setItems={(value) => onSet(field.key, value)}
          />
        );
      case "int[]":
        const ints = state[field.key] || [0];

        return (
          <ArrayOf
            Component={NumberField}
            label={field.label}
            emptyValue={0}
            items={ints}
            setItems={(value) => onSet(field.key, value)}
          />
        );
      case "string[]":
        const strings = state[field.key] || [""];

        return (
          <ArrayOf
            Component={TextField}
            label={field.label}
            emptyValue=""
            items={strings}
            setItems={(value) => onSet(field.key, value)}
          />
        );
      default:
        break;
    }
  };

  const onShowDialog = () => {
    setDialogShown(true);
  };

  const onHideDialog = () => {
    setDialogShown(false);
  };

  const onPress = () => {
    if (dialog) {
      onShowDialog();
    } else {
      onRun && onRun(state);
    }
  };

  return (
    <>
      <DialogTrigger isOpen={dialogShown}>
        {null}
        <TaskDialog {...{ task, onHideDialog, onRun, fields, resolveField }} />
      </DialogTrigger>

      <View
        borderWidth="thin"
        borderColor="dark"
        borderRadius="medium"
        padding="size-100"
      >
        <Flex direction="column" gap="size-100">
          <Flex alignItems="center" justifyContent="space-between">
            <Text>{task}</Text>
            <ActionButton onPress={onPress}>
              {dialog ? <ShowMenu /> : <Play />}
            </ActionButton>
          </Flex>
          {!dialog && fields && fields.map((field) => resolveField(field))}
        </Flex>
      </View>
    </>
  );
}
