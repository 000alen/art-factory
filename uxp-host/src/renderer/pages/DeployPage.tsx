import React, { useState, useEffect, useContext, useMemo } from "react";
import useStateRef from "react-usestateref";
import { useNavigate, useLocation } from "react-router-dom";
import {
  TextField,
  Flex,
  Heading,
  MenuTrigger,
  Menu,
  Item,
  ActionButton,
  Link,
  ContextualHelp,
  Content,
  Text,
  Button,
  ButtonGroup,
} from "@adobe/react-spectrum";
import More from "@spectrum-icons/workflow/More";
import { Networks } from "../constants";
import { ToolbarContext } from "../components/Toolbar";
import { useErrorHandler } from "../components/ErrorHandler";
import { Instance } from "../typings";
import Back from "@spectrum-icons/workflow/Back";
import { ImageItem } from "../components/ImageItem";
import { createProvider, factoryDeploy, factoryGetImage, XXX } from "../ipc";
import { v4 as uuid } from "uuid";
import WalletConnectQRCodeModal from "@walletconnect/qrcode-modal";

interface DeployPageState {
  projectDir: string;
  instance: Instance;
  id: string;
  dirty: boolean;
}

export function DeployPage() {
  const toolbarContext = useContext(ToolbarContext);
  const task = useErrorHandler();

  const navigate = useNavigate();
  const { state } = useLocation();
  const { projectDir, instance, id, dirty: _dirty } = state as DeployPageState;
  const { configuration, generations } = instance;

  const [dirty, setDirty] = useState(_dirty);
  const [providerId, setProviderId] = useState<string>(null);
  const [generationName, setGenerationName] = useState(generations[0].name);
  const [url, setUrl] = useState<string>(null);

  const [networkKey, setNetworkKey] = useState("rinkeby");

  useEffect(() => {
    toolbarContext.addButton("back", "Back", <Back />, () => onBack());

    return () => {
      toolbarContext.removeButton("back");
    };
  }, [networkKey]);

  useEffect(() => {
    task("XXX", async () => {
      const generation = generations.find((g) => g.name === generationName);
      const base64String = await factoryGetImage(
        id,
        generation,
        generation.collection[0]
      );
      const url = `data:image/png;base64,${base64String}`;

      setUrl(url);
    })();
  }, [generationName]);

  const generationItems = useMemo(
    () =>
      generations.map(({ name }) => ({
        name,
      })),
    [generations]
  );

  const onBack = () =>
    navigate("/factory", { state: { projectDir, instance, id, dirty } });

  const onConnect = task("connect", async () => {
    const providerId = uuid();
    const uri = await createProvider(providerId, ({ connected }) => {
      WalletConnectQRCodeModal.close();
      console.log(connected);
    });
    WalletConnectQRCodeModal.open(uri, () => {});
    setProviderId(providerId);
  });

  const onDeploy = task("deployment", async () => {
    // const {
    //   imagesCid,
    //   metadataCid,
    //   notRevealedImageCid,
    //   notRevealedMetadataCid,
    //   contractAddress,
    //   abi,
    //   compilerVersion,
    //   transactionHash,
    // } = await factoryDeploy(
    //   id,
    //   providerId,
    //   generations.find((g) => g.name === generationName)
    // );

    // console.log(
    //   imagesCid,
    //   metadataCid,
    //   notRevealedImageCid,
    //   notRevealedMetadataCid,
    //   contractAddress
    // );

    const uri = await XXX(({ error, connected, done }) => {
      if (error) {
        WalletConnectQRCodeModal.close();
        console.log("error");
      } else if (connected) {
        WalletConnectQRCodeModal.close();
        console.log("connected");
      } else if (done) {
        console.log("done");
      }
    });
    WalletConnectQRCodeModal.open(uri, () => {});
  });

  const onSave = task("continue", async () => {
    // navigate("/instance", {
    //   state: {
    //     id,
    //     collection,
    //     inputDir,
    //     outputDir,
    //     configuration,
    //     imagesCid,
    //     metadataCid,
    //     network: networkKey,
    //     contractAddress,
    //     abi,
    //   },
    // });
  });

  return (
    <Flex
      direction="column"
      height="100%"
      margin="size-100"
      gap="size-100"
      justifyContent="space-between"
    >
      <Flex gap="size-100" alignItems="center">
        <Heading level={1} marginStart={16}>
          Deploy {configuration.contractType} to {Networks[networkKey].name}
        </Heading>
        <MenuTrigger>
          <ActionButton>
            <More />
          </ActionButton>
          <Menu
            selectionMode="single"
            disallowEmptySelection={true}
            selectedKeys={[networkKey]}
            onSelectionChange={(selectedKeys: Set<string>) =>
              setNetworkKey([...selectedKeys].shift())
            }
          >
            <Item key="mainnet">{Networks["mainnet"].name}</Item>
            <Item key="ropsten">{Networks["ropsten"].name}</Item>
            <Item key="rinkeby">{Networks["rinkeby"].name}</Item>
          </Menu>
        </MenuTrigger>
      </Flex>

      <Flex height="60vh" gap="size-100" justifyContent="space-evenly">
        <Flex>
          <Flex direction="column" justifyContent="center" alignItems="center">
            <MenuTrigger>
              <ActionButton width="100%">{generationName}</ActionButton>
              <Menu
                items={generationItems}
                selectionMode="single"
                disallowEmptySelection={true}
                selectedKeys={[generationName]}
                onSelectionChange={(selectedKeys) => {
                  const selectedKey = [...selectedKeys].shift() as string;
                  setGenerationName(selectedKey);
                }}
              >
                {({ name }) => <Item key={name}>{name}</Item>}
              </Menu>
            </MenuTrigger>
            <ImageItem src={url} />
          </Flex>
        </Flex>
        <Flex direction="column" justifyContent="center" alignItems="center">
          <TextField width="100%" isReadOnly={true} label="Images CID" />

          <TextField width="100%" isReadOnly={true} label="Metadata CID" />

          <Flex width="100%" gap="size-100" alignItems="end">
            <TextField
              width="100%"
              isReadOnly={true}
              label="Contract Address"
            />
          </Flex>
        </Flex>
      </Flex>

      <ButtonGroup align="end">
        <Button variant="cta" onPress={onDeploy}>
          Deploy
        </Button>
        <Button variant="secondary" onPress={onConnect}>
          Connect
        </Button>
        <Button variant="secondary" onPress={onSave}>
          Save
        </Button>
      </ButtonGroup>
    </Flex>
  );
}
