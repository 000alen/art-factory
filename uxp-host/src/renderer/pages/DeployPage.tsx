import React, { useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { v4 as uuid } from "uuid";

import {
    ActionButton, Button, ButtonGroup, Flex, Heading, Item, Menu, MenuTrigger, TextField
} from "@adobe/react-spectrum";
import Back from "@spectrum-icons/workflow/Back";
import More from "@spectrum-icons/workflow/More";
import WalletConnectQRCodeModal from "@walletconnect/qrcode-modal";

import { useErrorHandler } from "../components/ErrorHandler";
import { ImageItem } from "../components/ImageItem";
import { ToolbarContext } from "../components/Toolbar";
import { Networks } from "../constants";
import { createProvider, factoryDeploy, factoryGetImage } from "../ipc";
import { Deployment, Instance, Network } from "../typings";

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
  const [connected, setConnected] = useState(false);
  const [generationName, setGenerationName] = useState(generations[0].name);
  const [url, setUrl] = useState<string>(null);

  const [networkKey, setNetworkKey] = useState("rinkeby");

  const [imagesCid, setImagesCid] = useState<string>(null);
  const [metadataCid, setMetadataCid] = useState<string>(null);
  const [notRevealedImageCid, setNotRevealedImageCid] = useState<string>(null);
  const [notRevealedMetadataCid, setNotRevealedMetadataCid] =
    useState<string>(null);
  const [contractAddress, setContractAddress] = useState<string>(null);
  const [abi, setAbi] = useState<any>(null);
  const [compilerVersion, setCompilerVersion] = useState<string>(null);

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
      setConnected(connected);
    });
    WalletConnectQRCodeModal.open(uri, () => {});
    setProviderId(providerId);
  });

  const onDeploy = task("deployment", async () => {
    const {
      imagesCid,
      metadataCid,
      notRevealedImageCid,
      notRevealedMetadataCid,
      contractAddress,
      abi,
      compilerVersion,
    } = await factoryDeploy(
      id,
      providerId,
      generations.find((g) => g.name === generationName)
    );

    setImagesCid(imagesCid);
    setMetadataCid(metadataCid);
    setNotRevealedImageCid(notRevealedImageCid);
    setNotRevealedMetadataCid(notRevealedMetadataCid);
    setContractAddress(contractAddress);
    setAbi(abi);
    setCompilerVersion(compilerVersion);
  });

  const onSave = task("continue", async () => {
    const deployment: Deployment = {
      imagesCid,
      metadataCid,
      notRevealedImageCid,
      notRevealedMetadataCid,
      contractAddress,
      abi,
      compilerVersion,
      network: Network.RINKEBY,
    };

    navigate("/factory", {
      state: {
        projectDir,
        instance: { ...instance, deployment, frozen: true },
        id,
        dirty: true,
      },
    });
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
