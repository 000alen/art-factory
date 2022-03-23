import React, { useState, createContext, useContext } from "react";
import { Flex, DialogTrigger, ActionButton, Text } from "@adobe/react-spectrum";
import Settings from "@spectrum-icons/workflow/Settings";
import { SecretsDialog } from "./SecretsDialog";

interface ButtonItemProps {
  label: string;
  icon: JSX.Element;
  onClick: () => void;
}

interface ToolbarProviderProps {
  autoPlace: boolean;
}

export function useToolbar() {
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

  return {
    buttons,
    addButton,
    removeButton,
  };
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

const ButtonItem: React.FC<ButtonItemProps> = ({ label, icon, onClick }) => {
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
    <Flex justifyContent="space-between" margin="size-100">
      {children}

      <Flex direction="row-reverse" gap="size-100">
        <DialogTrigger>
          <ActionButton>
            <Settings size="M" />
          </ActionButton>
          {(close) => <SecretsDialog close={close} />}
        </DialogTrigger>
        {buttons.map((button) => (
          <ButtonItem {...button} />
        ))}
      </Flex>
    </Flex>
  );
};

export const ToolbarProvider: React.FC<ToolbarProviderProps> = ({
  autoPlace = true,
  children,
}) => {
  const { buttons, addButton, removeButton } = useToolbar();

  return (
    <ToolbarContext.Provider value={{ buttons, addButton, removeButton }}>
      {autoPlace && <Toolbar />}
      {children}
    </ToolbarContext.Provider>
  );
};
