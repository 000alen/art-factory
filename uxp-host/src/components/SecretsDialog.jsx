import React, { useState, useEffect } from "react";

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

export function SecretsDialog({ close }) {
  const [pinataApiKey, _setPinataApiKey] = useState("");
  const [pinataSecretApiKey, _setPinataSecretApiKey] = useState("");
  const [infuraId, _setInfuraId] = useState("");

  useEffect(() => {
    getPinataApiKey().then((_pinataApiKey) => {
      _setPinataApiKey(_pinataApiKey || "");
    });
    getPinataSecretApiKey().then((_pinataSecretApiKey) => {
      _setPinataSecretApiKey(_pinataSecretApiKey || "");
    });
    getInfuraId().then((_infuraId) => {
      _setInfuraId(_infuraId || "");
    });
  }, []);

  const onSave = () => {
    setPinataApiKey(pinataApiKey);
    setPinataSecretApiKey(pinataSecretApiKey);
    setInfuraId(infuraId);
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
