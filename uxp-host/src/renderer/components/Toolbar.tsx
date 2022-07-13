import React, { createContext, useContext, useEffect, useState } from "react";

import { ActionButton, DialogTrigger, Flex, Text } from "@adobe/react-spectrum";
import Settings from "@spectrum-icons/workflow/Settings";

import { SecretsDialog } from "./SecretsDialog";

interface ButtonProps {
  key: string;
  label: string;
  icon: JSX.Element;
  onClick: () => void;
}

interface ToolbarProviderProps {
  autoPlace: boolean;
}

export function useToolbar(buttons?: ButtonProps[]) {
  const toolbarContext = useContext(ToolbarContext);

  useEffect(() => {
    if (!buttons) return;
    buttons.map(({ key, label, icon, onClick }) =>
      toolbarContext.addButton(key, label, icon, onClick)
    );

    return () => {
      if (!buttons) return;
      buttons.map(({ key }) => toolbarContext.removeButton(key));
    };
  }, []);
}

export const ToolbarContext = createContext({
  buttons: [],
  addButton: (
    key: string,
    label: string,
    icon: JSX.Element,
    onClick: () => void
  ) => {},
  removeButton: (key: string) => {},
});

const ButtonItem: React.FC<ButtonProps> = ({ label, icon, onClick }) => {
  return (
    <ActionButton onPress={() => onClick && onClick()}>
      {icon}
      {label && <Text>{label}</Text>}
    </ActionButton>
  );
};

export const Toolbar: React.FC = ({ children }) => {
  const { buttons } = useContext(ToolbarContext);

  return (
    <Flex height="32px" justifyContent="space-between" margin="size-100">
      {children}

      <Flex direction="row-reverse" gap="size-100">
        <DialogTrigger>
          <ActionButton>
            <Settings />
          </ActionButton>
          {(close) => <SecretsDialog close={close} />}
        </DialogTrigger>
        {buttons.map((button, i) => (
          <ButtonItem key={i} {...button} />
        ))}
      </Flex>
    </Flex>
  );
};

export const ToolbarProvider: React.FC<ToolbarProviderProps> = ({
  autoPlace = true,
  children,
}) => {
  const [buttons, setButtons] = useState([]);

  const addButton = (
    key: string,
    label: string,
    icon: JSX.Element,
    onClick: () => void
  ) => {
    setButtons((prevButtons) => [
      ...prevButtons,
      { key, label, icon, onClick },
    ]);
  };

  const removeButton = (key: string) => {
    setButtons((prevButtons) =>
      prevButtons.filter((button) => button.key !== key)
    );
  };

  return (
    <ToolbarContext.Provider value={{ buttons, addButton, removeButton }}>
      {autoPlace && <Toolbar />}
      {children}
    </ToolbarContext.Provider>
  );
};
