// #region Declarations
interface BaseField<T> {
  key: string;
  type: string;
  label: string;
  value: T;
}

interface AddressField extends BaseField<string> {
  type: "address";
}

interface IntField extends BaseField<number> {
  type: "int";
  initial: number;
  min: number;
  max: number;
}

interface FloatField extends BaseField<number> {
  type: "float";
  initial: number;
  step: number;
  min: number;
  max: number;
}

interface StringField extends BaseField<string> {
  type: "string";
  initial: string;
}

interface AddressesField extends BaseField<string> {
  type: "address[]";
}

interface IntsField extends BaseField<number> {
  type: "int[]";
  initial: number;
  min: number;
  max: number;
}

interface FloatsField extends BaseField<number> {
  type: "float[]";
  initial: number;
  step: number;
  min: number;
  max: number;
}

interface StringsField extends BaseField<string> {
  type: "string[]";
  initial: string;
}

export interface CustomField extends BaseField<any> {
  type: "custom";
  [key: string]: any;
}

type Field =
  | AddressField
  | IntField
  | FloatField
  | StringField
  | AddressesField
  | IntsField
  | FloatsField
  | StringsField
  | CustomField;

// #endregion

import React, { useState } from "react";
import {
  Flex,
  View,
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
  name: string;
  state: Record<string, any>;
  fields?: Field[];
  resolveField: (field: Field) => any;
  onHideDialog: () => void;
  onRun: (...args: any[]) => void;
}

interface TaskItemProps {
  name: string;
  fields?: Field[];
  useDialog?: boolean;
  resolveCustomFields?: (
    field: CustomField,
    value: any,
    onChange: (value: any) => void
  ) => any;
  onRun: (...args: any[]) => void;
}

const TaskDialog: React.FC<TaskDialogProps> = ({
  name,
  state,
  fields,
  resolveField,
  onHideDialog,
  onRun,
}) => {
  return (
    <Dialog>
      <Heading>{name}</Heading>
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
        <Button variant="cta" onPress={() => onRun(state)}>
          Run
        </Button>
      </ButtonGroup>
    </Dialog>
  );
};

export const TaskItem: React.FC<TaskItemProps> = ({
  name,
  onRun,
  fields,
  resolveCustomFields,
  useDialog,
}) => {
  const [state, setState] = useState({});
  const [dialogShown, setDialogShown] = useState(false);

  const onSet = (key: string, value: any) =>
    setState({ ...state, [key]: value });

  const onShowDialog = () => setDialogShown(true);

  const onHideDialog = () => setDialogShown(false);

  const onPress = () => {
    if (useDialog) onShowDialog();
    else onRun(state);
  };

  const resolveField = (field: Field) => {
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
            step={1}
            minValue={field.min}
            maxValue={field.max}
          />
        );
      case "float":
        return (
          <NumberField
            key={field.key}
            label={field.label}
            onChange={(value) => onSet(field.key, value)}
            step={field.step}
            minValue={field.min}
            maxValue={field.max}
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
            key={field.key}
            Component={TextField}
            props={{ placeholder: "0x" }}
            label={field.label}
            emptyValue=""
            items={addresses}
            setItems={(value) => onSet(field.key, value)}
          />
        );
      case "int[]":
        const ints = state[field.key] || [field.initial];

        return (
          <ArrayOf
            key={field.key}
            Component={NumberField}
            props={{
              step: 1,
              minValue: field.min,
              maxValue: field.max,
            }}
            label={field.label}
            emptyValue={field.initial}
            items={ints}
            setItems={(value) => onSet(field.key, value)}
          />
        );
      case "float[]":
        const floats = state[field.key] || [field.initial];

        return (
          <ArrayOf
            key={field.key}
            Component={NumberField}
            props={{
              step: field.step,
              minValue: field.min,
              maxValue: field.max,
            }}
            label={field.label}
            emptyValue={field.initial}
            items={floats}
            setItems={(value) => onSet(field.key, value)}
          />
        );
      case "string[]":
        const strings = state[field.key] || [field.initial];

        return (
          <ArrayOf
            key={field.key}
            Component={TextField}
            label={field.label}
            emptyValue={field.initial}
            items={strings}
            setItems={(value) => onSet(field.key, value)}
          />
        );
      default:
        return (
          resolveCustomFields &&
          resolveCustomFields(
            field,
            state[(field as CustomField).key],
            (value) => onSet((field as CustomField).key, value)
          )
        );
    }
  };

  return (
    <>
      <DialogTrigger isOpen={dialogShown}>
        {null}
        <TaskDialog
          {...{ name, state, fields, resolveField, onHideDialog, onRun }}
        />
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
            <Heading>{name}</Heading>
            <ActionButton onPress={onPress}>
              {useDialog ? <ShowMenu /> : <Play />}
            </ActionButton>
          </Flex>
          {!useDialog && fields && fields.map((field) => resolveField(field))}
        </Flex>
      </View>
    </>
  );
};
