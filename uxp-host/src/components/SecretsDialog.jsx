import React, { useState, useEffect, useContext } from "react";

import {
  Flex,
  ContextualHelp,
  Footer,
  Link,
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
  getEtherscanApiKey,
  setEtherscanApiKey,
} from "../ipc";
import { GenericDialogContext } from "./GenericDialog";

export function SecretsDialog({ close }) {
  const genericDialogContext = useContext(GenericDialogContext);
  const [pinataApiKey, _setPinataApiKey] = useState("");
  const [pinataSecretApiKey, _setPinataSecretApiKey] = useState("");
  const [infuraId, _setInfuraId] = useState("");
  const [etherscanApiKey, _setEtherscanApiKey] = useState("");

  useEffect(() => {
    // ! TODO: Proper error handling
    getPinataApiKey()
      .then((_pinataApiKey) => _setPinataApiKey(_pinataApiKey || ""))
      .catch((error) => {
        genericDialogContext.show("Error", error.message, null);
      });

    // ! TODO: Proper error handling
    getPinataSecretApiKey()
      .then((_pinataSecretApiKey) =>
        _setPinataSecretApiKey(_pinataSecretApiKey || "")
      )
      .catch((error) => {
        genericDialogContext.show("Error", error.message, null);
      });

    // ! TODO: Proper error handling
    getInfuraId()
      .then((_infuraId) => _setInfuraId(_infuraId || ""))
      .catch((error) => {
        genericDialogContext.show("Error", error.message, null);
      });

    // ! TODO: Proper error handling
    getEtherscanApiKey()
      .then((_etherscanApiKey) => _setEtherscanApiKey(_etherscanApiKey || ""))
      .catch((error) => {
        genericDialogContext.show("Error", error.message, null);
      });
  }, [genericDialogContext]);

  const onSave = () => {
    // ! TODO: Proper error handling
    setPinataApiKey(pinataApiKey).catch((error) => {
      genericDialogContext.show("Error", error.message, null);
    });
    // ! TODO: Proper error handling
    setPinataSecretApiKey(pinataSecretApiKey).catch((error) => {
      genericDialogContext.show("Error", error.message, null);
    });
    // ! TODO: Proper error handling
    setInfuraId(infuraId).catch((error) => {
      genericDialogContext.show("Error", error.message, null);
    });
    // ! TODO: Proper error handling
    setEtherscanApiKey(etherscanApiKey).catch((error) => {
      genericDialogContext.show("Error", error.message, null);
    });
    close();
  };

  return (
    <Dialog>
      <Heading>
        <Flex alignItems="center" gap="size-100">
          <Text>Secrets</Text>
          <ContextualHelp variant="help">
            <Heading>What are secrets?</Heading>
            <Content>
              <Text>
                {/* ! TODO: Text and links */}
                Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              </Text>
            </Content>
            <Footer>
              <Flex gap="size-100">
                <Link>Pinata</Link>|<Link>Infura</Link>
              </Flex>
            </Footer>
          </ContextualHelp>
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
          <TextField
            value={etherscanApiKey}
            onChange={_setEtherscanApiKey}
            type="password"
            label="Etherscan API Key"
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
