import React from "react";

import {
  View,
  ActionButton,
  Flex,
  Item,
  ActionGroup,
  Heading,
} from "@adobe/react-spectrum";

import Add from "@spectrum-icons/workflow/Add";
import Remove from "@spectrum-icons/workflow/Remove";
import ChevronUp from "@spectrum-icons/workflow/ChevronUp";
import ChevronDown from "@spectrum-icons/workflow/ChevronDown";

interface ArrayItemProps {
  Component: React.ComponentType<any> | Function;
  props: any;
  value: any;
  moveable: boolean;
  onChange: (value: any) => void;
  onMoveDown: () => void;
  onMoveUp: () => void;
  onRemove: () => void;
}

export const ArrayItem: React.FC<ArrayItemProps> = ({
  Component,
  props,
  value,
  moveable,
  onChange,
  onMoveDown,
  onMoveUp,
  onRemove,
}) => {
  const onAction = (action: string) => {
    switch (action) {
      case "moveDown":
        return onMoveDown();
      case "moveUp":
        return onMoveUp();
      case "remove":
        return onRemove();
      default:
        break;
    }
  };

  return typeof Component === "function" ? (
    (Component as Function)({
      ...props,
      value,
      moveable,
      onChange,
      onMoveDown,
      onMoveUp,
      onRemove,
    })
  ) : (
    <Flex gap="size-100" justifyContent="space-between">
      {/* @ts-ignore */}
      <Component
        {...props}
        width="100%"
        aria-label={value}
        value={value}
        onChange={onChange}
      />
      <ActionGroup overflowMode="collapse" onAction={onAction}>
        {moveable && (
          <Item key="moveDown">
            <ChevronDown />
          </Item>
        )}
        {moveable && (
          <Item key="moveUp">
            <ChevronUp />
          </Item>
        )}

        <Item key="remove">
          <Remove />
        </Item>
      </ActionGroup>
    </Flex>
  );
};

interface ArrayOfProps {
  Component: React.ComponentType<any>;
  props?: any;
  label: string;
  emptyValue: any;
  items: any[];
  setItems: (items: any[]) => void;
  moveable?: boolean;
  heading?: boolean;
  border?: boolean;
  width?: string;
  direction?: "row" | "column";
}

export const ArrayOf: React.FC<ArrayOfProps> = ({
  Component,
  props,
  label,
  emptyValue,
  items,
  setItems,
  moveable,
  heading = false,
  border = true,
  width = "30vw",
  direction = "column",
  children,
}) => {
  const onAdd = () => {
    setItems([...items, emptyValue]);
  };

  const onEdit = (i: number, value: any) => {
    setItems(items.map((item, j) => (j === i ? value : item)));
  };

  const onMoveDown = (i: number) => {
    if (i < items.length - 1) {
      const newItems = [...items];
      [newItems[i], newItems[i + 1]] = [newItems[i + 1], newItems[i]];
      setItems(newItems);
    }
  };

  const onMoveUp = (i: number) => {
    if (i > 0) {
      const newItems = [...items];
      [newItems[i - 1], newItems[i]] = [newItems[i], newItems[i - 1]];
      setItems(newItems);
    }
  };

  const onRemove = (i: number) => {
    setItems(items.filter((_, j) => j !== i));
  };

  return (
    <View>
      {heading ? (
        <Heading>{label}</Heading>
      ) : (
        <label className="spectrum-FieldLabel">{label}</label>
      )}

      {children}

      <View
        width={width}
        height="100%"
        padding="size-100"
        overflow="auto"
        {...(border
          ? {
              borderWidth: "thin",
              borderColor: "dark",
              borderRadius: "medium",
            }
          : {})}
      >
        <Flex direction={direction} gap="size-100">
          {items.map((item, i) => (
            <ArrayItem
              key={i}
              Component={Component}
              props={props}
              value={item}
              moveable={moveable}
              onChange={(value) => onEdit(i, value)}
              onMoveDown={() => onMoveDown(i)}
              onMoveUp={() => onMoveUp(i)}
              onRemove={() => onRemove(i)}
            />
          ))}
        </Flex>
      </View>
      <ActionButton marginTop={8} onPress={onAdd}>
        <Add />
      </ActionButton>
    </View>
  );
};
