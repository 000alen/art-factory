import React, { createContext, ReactNode, useContext, useState } from "react";

import {
    Button, ButtonGroup, Content, Dialog, DialogTrigger, Divider, Heading
} from "@adobe/react-spectrum";

interface GenericDialogProviderProps {
  autoPlace?: boolean;
  children?: ReactNode;
}

export function useGenericDialog() {
  const [isShown, setIsShown] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [buttons, setButtons] = useState(null);

  const show = (title: string, content: any, buttons?: ReactNode) => {
    setIsShown(true);
    setTitle(title);
    setContent(content);
    setButtons(buttons);
  };

  const hide = () => {
    setIsShown(false);
  };

  return {
    isShown,
    title,
    content,
    buttons,
    show,
    hide,
  };
}

export const GenericDialogContext = createContext({
  isShown: false,
  title: "",
  content: "",
  buttons: [],
  show: (title: string, content: any, buttons?: ReactNode) => {},
  hide: () => {},
});

export function GenericDialog() {
  const { isShown, title, content, buttons, hide } =
    useContext(GenericDialogContext);

  return (
    <DialogTrigger isOpen={isShown}>
      {null}
      <Dialog>
        <Heading>{title}</Heading>
        <Divider />
        <Content>{content}</Content>
        <ButtonGroup>
          {buttons ? (
            buttons.map((button) => (
              <Button
                key={button.label}
                variant={button.variant}
                onPress={async () => {
                  await button.onPress();
                  hide();
                }}
              >
                {button.label}
              </Button>
            ))
          ) : (
            <Button variant="secondary" onPress={hide}>
              Close
            </Button>
          )}
        </ButtonGroup>
      </Dialog>
    </DialogTrigger>
  );
}

export const GenericDialogProvider: React.FC<GenericDialogProviderProps> = ({
  autoPlace = true,
  children,
}) => {
  const { isShown, title, content, buttons, show, hide } = useGenericDialog();

  return (
    <GenericDialogContext.Provider
      value={{ isShown, title, content, buttons, show, hide }}
    >
      {autoPlace && <GenericDialog />}
      {children}
    </GenericDialogContext.Provider>
  );
};
