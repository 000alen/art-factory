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
import Play from "@spectrum-icons/workflow/Play";
import ShowMenu from "@spectrum-icons/workflow/ShowMenu";

import { ArrayOf } from "./ArrayOf";

interface TaskDialogProps {
  task: string;
  onHideDialog: () => void;
  onRun: () => void;
  fields: any[];
  resolveField: (field: string) => any;
}

interface TaskItemProps {
  task: string;
  onRun: (...args: any[]) => void;
  fields?: any[];
  dialog?: boolean;
}

const TaskDialog: React.FC<TaskDialogProps> = ({
  task,
  onHideDialog,
  onRun,
  fields,
  resolveField,
}) => {
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
        <Button variant="secondary" onPress={onHideDialog}>
          Close
        </Button>
        <Button variant="cta" onPress={() => onRun && onRun()}>
          Run
        </Button>
      </ButtonGroup>
    </Dialog>
  );
};

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onRun,
  fields,
  dialog,
}) => {
  const [state, setState] = useState({});
  const [dialogShown, setDialogShown] = useState(false);

  const onSet = (key: string, value: any) => {
    setState({ ...state, [key]: value });
  };

  // {key, type, label}
  const resolveField = (field: any) => {
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
            minValue={1}
          />
        );
      case "float":
        return (
          <NumberField
            key={field.key}
            label={field.label}
            onChange={(value) => onSet(field.key, value)}
            minValue={0}
            step={0.01}
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
        // @ts-ignore
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
        // @ts-ignore
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
        // @ts-ignore
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
          <Flex
            gap="size-100"
            alignItems="center"
            justifyContent="space-between"
          >
            <Heading>{task}</Heading>
            <ActionButton onPress={onPress}>
              {dialog ? <ShowMenu /> : <Play />}
            </ActionButton>
          </Flex>
          {!dialog && fields && fields.map((field) => resolveField(field))}
        </Flex>
      </View>
    </>
  );
};
