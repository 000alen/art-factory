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
import { useErrorHandler } from "./ErrorHandler";

interface SecretsDialogProps {
  close: () => void;
}

export const SecretsDialog: React.FC<SecretsDialogProps> = ({ close }) => {
  const genericDialogContext = useContext(GenericDialogContext);
  const [pinataApiKey, _setPinataApiKey] = useState("");
  const [pinataSecretApiKey, _setPinataSecretApiKey] = useState("");
  const [infuraId, _setInfuraId] = useState("");
  const [etherscanApiKey, _setEtherscanApiKey] = useState("");
  const { task } = useErrorHandler(genericDialogContext);

  useEffect(() => {
    task("loading secrets", async () => {
      const pinataApiKey =
        ((await getPinataApiKey()) as unknown as string) || "";
      const pinataSecretApiKey =
        ((await getPinataSecretApiKey()) as unknown as string) || "";
      const infuraId = ((await getInfuraId()) as unknown as string) || "";
      const etherscanApiKey =
        ((await getEtherscanApiKey()) as unknown as string) || "";
      _setPinataApiKey(pinataApiKey);
      _setPinataSecretApiKey(pinataSecretApiKey);
      _setInfuraId(infuraId);
      _setEtherscanApiKey(etherscanApiKey);
    })();
  }, []);

  const onSave = task("save", async () => {
    await setPinataApiKey(pinataApiKey);
    await setPinataSecretApiKey(pinataSecretApiKey);
    await setInfuraId(infuraId);
    await setEtherscanApiKey(etherscanApiKey);
    close();
  });

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
};
