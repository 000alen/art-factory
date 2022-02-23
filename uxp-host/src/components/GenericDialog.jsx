import React from "react";
import {
  Dialog,
  Heading,
  Divider,
  Content,
  Text,
  ButtonGroup,
  Button,
} from "@adobe/react-spectrum";

export function GenericDialog({ title, text, buttons, onHide }) {
  return (
    <Dialog>
      <Heading>{title}</Heading>
      <Divider />
      <Content>
        <Text>{text}</Text>
      </Content>

      <ButtonGroup>
        {buttons ? buttons : <Button onPress={onHide}>Close</Button>}
      </ButtonGroup>
    </Dialog>
  );
}
