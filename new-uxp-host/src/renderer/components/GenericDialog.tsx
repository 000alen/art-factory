import React, { useState, createContext, useContext } from "react";
import {
  Dialog,
  Heading,
  Divider,
  Content,
  ButtonGroup,
  Button,
  DialogTrigger,
} from "@adobe/react-spectrum";

export function useGenericDialog() {
  const [isShown, setIsShown] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [buttons, setButtons] = useState([]);

  const show = (title: string, content: any, buttons?: JSX.Element) => {
    setIsShown(true);
    setTitle(title);
    setContent(content);
    // @ts-ignore
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
  show: (title: string, content: any, buttons?: JSX.Element) => {},
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

export function GenericDialogProvider({
  autoPlace = true,
  children,
}: {
  autoPlace: boolean;
  children?: JSX.Element[] | JSX.Element;
}) {
  const { isShown, title, content, buttons, show, hide } = useGenericDialog();

  return (
    <GenericDialogContext.Provider
      value={{ isShown, title, content, buttons, show, hide }}
    >
      {autoPlace && <GenericDialog />}
      {children}
    </GenericDialogContext.Provider>
  );
}
