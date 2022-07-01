import React, { useEffect, useState } from "react";

import {
    Button, ButtonGroup, Content, ContextualHelp, Dialog, Divider, Flex, Footer, Form, Heading,
    Link, Text, TextField
} from "@adobe/react-spectrum";

import {
    getEtherscanApiKey, getInfuraProjectId, getMaticVigilApiKey, getOpenseaApiKey, getPinataApiKey,
    getPinataSecretApiKey, setEtherscanApiKey, setInfuraProjectId, setMaticVigilApiKey,
    setOpenseaApiKey, setPinataApiKey, setPinataSecretApiKey
} from "../ipc";
import { useErrorHandler } from "./ErrorHandler";

interface SecretsDialogProps {
  close: () => void;
}

export const SecretsDialog: React.FC<SecretsDialogProps> = ({ close }) => {
  const [pinataApiKey, _setPinataApiKey] = useState("");
  const [pinataSecretApiKey, _setPinataSecretApiKey] = useState("");
  const [infuraProjectId, _setInfuraProjectId] = useState("");
  const [etherscanApiKey, _setEtherscanApiKey] = useState("");
  const [openseaApiKey, _setOpenseaApiKey] = useState("");
  const [maticVigilApiKey, _setMaticVigilApiKey] = useState("");
  const task = useErrorHandler();

  useEffect(() => {
    task("loading secrets", async () => {
      const pinataApiKey =
        ((await getPinataApiKey()) as unknown as string) || "";
      const pinataSecretApiKey =
        ((await getPinataSecretApiKey()) as unknown as string) || "";
      const infuraProjectId =
        ((await getInfuraProjectId()) as unknown as string) || "";
      const etherscanApiKey =
        ((await getEtherscanApiKey()) as unknown as string) || "";
      const openseaApiKey =
        ((await getOpenseaApiKey()) as unknown as string) || "";
      const maticVigilApiKey =
        ((await getMaticVigilApiKey()) as unknown as string) || "";
      _setPinataApiKey(pinataApiKey);
      _setPinataSecretApiKey(pinataSecretApiKey);
      _setInfuraProjectId(infuraProjectId);
      _setEtherscanApiKey(etherscanApiKey);
      _setOpenseaApiKey(openseaApiKey);
      _setMaticVigilApiKey(maticVigilApiKey);
    })();
  }, []);

  const onSave = task("save", async () => {
    await setPinataApiKey(pinataApiKey);
    await setPinataSecretApiKey(pinataSecretApiKey);
    await setInfuraProjectId(infuraProjectId);
    await setEtherscanApiKey(etherscanApiKey);
    await setOpenseaApiKey(openseaApiKey);
    await setMaticVigilApiKey(maticVigilApiKey);
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
                Secrets are used to connect to the different APIs, like Pinata
                or the Ethereum network.
              </Text>
            </Content>
            <Footer>
              <Flex gap="size-100">
                <Link>
                  <a href="https://www.pinata.cloud/" target="_blank">
                    Pinata
                  </a>
                </Link>
                |
                <Link>
                  <a href="https://infura.io/" target="_blank">
                    Infura
                  </a>
                </Link>
                |
                <Link>
                  <a href="https://etherscan.io/" target="_blank">
                    Etherscan
                  </a>
                </Link>
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
            value={infuraProjectId}
            onChange={_setInfuraProjectId}
            type="password"
            label="Infura Project ID"
          />
          <TextField
            value={etherscanApiKey}
            onChange={_setEtherscanApiKey}
            type="password"
            label="Etherscan API Key"
          />
          <TextField
            value={openseaApiKey}
            onChange={_setOpenseaApiKey}
            type="password"
            label="Opensea API Key"
          />
          <TextField
            value={maticVigilApiKey}
            onChange={_setMaticVigilApiKey}
            type="password"
            label="Matic Vigil API Key"
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
