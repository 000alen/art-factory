import React, { useState, useEffect, useContext } from "react";

import {
  Flex,
  Dialog,
  Heading,
  Divider,
  Content,
  Text,
  ButtonGroup,
  Button,
  Form,
  TextField,
} from "@adobe/react-spectrum";
import {
  getInfuraId,
  getPinataApiKey,
  getPinataSecretApiKey,
  setPinataApiKey,
  setPinataSecretApiKey,
  setInfuraId,
} from "../ipc";
import { DialogContext } from "../App";

export function SecretsDialog({ close }) {
  const dialogContext = useContext(DialogContext);
  const [pinataApiKey, _setPinataApiKey] = useState("");
  const [pinataSecretApiKey, _setPinataSecretApiKey] = useState("");
  const [infuraId, _setInfuraId] = useState("");

  useEffect(() => {
    // ! TODO: Proper error handling
    getPinataApiKey()
      .then((_pinataApiKey) => _setPinataApiKey(_pinataApiKey || ""))
      .catch((error) => {
        dialogContext.setDialog("Error", error.message, null, true);
      });

    // ! TODO: Proper error handling
    getPinataSecretApiKey()
      .then((_pinataSecretApiKey) =>
        _setPinataSecretApiKey(_pinataSecretApiKey || "")
      )
      .catch((error) => {
        dialogContext.setDialog("Error", error.message, null, true);
      });

    // ! TODO: Proper error handling
    getInfuraId()
      .then((_infuraId) => _setInfuraId(_infuraId || ""))
      .catch((error) => {
        dialogContext.setDialog("Error", error.message, null, true);
      });
  }, [dialogContext]);

  const onSave = () => {
    // ! TODO: Proper error handling
    setPinataApiKey(pinataApiKey).catch((error) => {
      dialogContext.setDialog("Error", error.message, null, true);
    });
    // ! TODO: Proper error handling
    setPinataSecretApiKey(pinataSecretApiKey).catch((error) => {
      dialogContext.setDialog("Error", error.message, null, true);
    });
    // ! TODO: Proper error handling
    setInfuraId(infuraId).catch((error) => {
      dialogContext.setDialog("Error", error.message, null, true);
    });
    close();
  };

  return (
    <Dialog>
      <Heading>
        <Flex alignItems="center" gap="size-100">
          <Text>Secrets</Text>
        </Flex>
      </Heading>
      <Divider />
      <Content>
        <Form>
          <TextField
            value={pinataApiKey}
            onChange={_setPinataApiKey}
            type="password"
            label="Pinata API Key"
          />
          <TextField
            value={pinataSecretApiKey}
            onChange={_setPinataSecretApiKey}
            type="password"
            label="Pinata Secret API Key"
          />
          <TextField
            value={infuraId}
            onChange={_setInfuraId}
            type="password"
            label="Infura ID"
          />
        </Form>
      </Content>
      <ButtonGroup>
        <Button variant="secondary" onPress={close}>
          Cancel
        </Button>
        <Button variant="cta" onPress={onSave}>
          Save
        </Button>
      </ButtonGroup>
    </Dialog>
  );
}
