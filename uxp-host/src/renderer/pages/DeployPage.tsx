import React, { useContext, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { v4 as uuid } from "uuid";

import {
  ActionButton,
  Button,
  ButtonGroup,
  Flex,
  Heading,
  Item,
  Menu,
  MenuTrigger,
  TextField,
  Text,
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
import { getGenerationPreview } from "../commands";
import { TriStateButton } from "../components/TriStateButton";
import moment from "moment";
import { Preview } from "../components/Preview";

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

  const [error] = useState(
    configuration.contractType === "721"
      ? generations.length < 1
      : configuration.contractType === "721_reveal_pause"
      ? generations.length < 2
      : true
  );

  const [generation, setGeneration] = useState(!error ? generations[0] : null);
  const [generationName, setGenerationName] = useState(
    !error ? generation.name : null
  );
  const [url, setUrl] = useState<string>(null);

  const [notRevealedGeneration, setNotRevealedGeneration] = useState(
    !error && configuration.contractType === "721_reveal_pause"
      ? generations[1]
      : null
  );
  const [notRevealedGenerationName, setNotRevealedGenerationName] = useState(
    !error && configuration.contractType === "721_reveal_pause"
      ? notRevealedGeneration.name
      : null
  );
  const [notRevealedUrl, setNotRevealedUrl] = useState<string>(null);

  const [imagesCid, setImagesCid] = useState<string>(null);
  const [metadataCid, setMetadataCid] = useState<string>(null);
  const [notRevealedImageCid, setNotRevealedImageCid] = useState<string>(null);
  const [notRevealedMetadataCid, setNotRevealedMetadataCid] =
    useState<string>(null);
  const [contractAddress, setContractAddress] = useState<string>(null);
  const [abi, setAbi] = useState<any>(null);
  const [compilerVersion, setCompilerVersion] = useState<string>(null);
  const [network, setNetwork] = useState("rinkeby");

  const [isWorking, setIsWorking] = useState(false);
  const [deployDone, setDeployDone] = useState(false);
  const [elapsedTime, setElapsedTime] = useState<string>(null);

  useEffect(() => {
    toolbarContext.addButton("back", "Back", <Back />, () => onBack());

    return () => {
      toolbarContext.removeButton("back");
    };
  }, []);

  useEffect(() => {
    task("preview", async () => {
      if (error) return;

      const generation = generations.find((g) => g.name === generationName);
      setUrl(await getGenerationPreview(id, generation));
      setGeneration(generation);
    })();
  }, [error, generationName]);

  useEffect(() => {
    task("preview", async () => {
      if (error || configuration.contractType !== "721_reveal_pause") return;

      const notRevealedGeneration = generations.find(
        (g) => g.name === notRevealedGenerationName
      );
      setNotRevealedUrl(await getGenerationPreview(id, notRevealedGeneration));
      setNotRevealedGeneration(notRevealedGeneration);
    })();
  }, [error, notRevealedGenerationName]);

  const generationItems = useMemo(
    () =>
      error
        ? null
        : generations.map(({ name }) => ({
            name,
          })),
    [error]
  );

  const onBack = () =>
    navigate("/factory", { state: { projectDir, instance, id, dirty } });

  const onDeploy = task("deployment", async () => {
    setIsWorking(true);

    const providerId = uuid();
    const uri = await createProvider(providerId, async ({ connected }) => {
      WalletConnectQRCodeModal.close();

      const start = moment(performance.now());
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
        generation,
        notRevealedGeneration
      );
      const end = moment(performance.now());
      const diff = end.diff(start);

      setElapsedTime(moment.utc(diff).format("HH:mm:ss.SSS"));
      setImagesCid(imagesCid);
      setMetadataCid(metadataCid);
      setNotRevealedImageCid(notRevealedImageCid);
      setNotRevealedMetadataCid(notRevealedMetadataCid);
      setContractAddress(contractAddress);
      setAbi(abi);
      setCompilerVersion(compilerVersion);
      setIsWorking(false);
      setDeployDone(true);
    });
    WalletConnectQRCodeModal.open(uri, () => {});
  });

  const onSave = () => {
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
  };

  return (
    <Flex
      direction="column"
      height="100%"
      margin="size-100"
      gap="size-100"
      justifyContent="space-between"
    >
      {error ? (
        <>
          <Heading level={1}>You need more generations to deploy</Heading>
          <ButtonGroup align="end">
            <Button variant="cta" onPress={onBack}>
              Back
            </Button>
          </ButtonGroup>
        </>
      ) : (
        <>
          <Flex gap="size-100" alignItems="center">
            <Heading level={1} marginStart={16}>
              Deploy {configuration.contractType} to {Networks[network].name}
            </Heading>
            <MenuTrigger>
              <ActionButton>
                <More />
              </ActionButton>
              <Menu
                selectionMode="single"
                disallowEmptySelection={true}
                selectedKeys={[network]}
                onSelectionChange={(selectedKeys: Set<string>) =>
                  setNetwork([...selectedKeys].shift())
                }
              >
                <Item key="mainnet">{Networks["mainnet"].name}</Item>
                <Item key="ropsten">{Networks["ropsten"].name}</Item>
                <Item key="rinkeby">{Networks["rinkeby"].name}</Item>
              </Menu>
            </MenuTrigger>
          </Flex>

          <Flex height="60vh" gap="size-100" justifyContent="space-evenly">
            <Flex
              direction="row"
              gap="size-100"
              justifyContent="center"
              alignItems="center"
            >
              {configuration.contractType === "721_reveal_pause" && (
                <Preview
                  name="Not Revealed"
                  showName={true}
                  url={notRevealedUrl}
                >
                  <MenuTrigger>
                    <ActionButton width="100%">
                      {notRevealedGenerationName}
                    </ActionButton>
                    <Menu
                      items={generationItems}
                      selectionMode="single"
                      disallowEmptySelection={true}
                      selectedKeys={[notRevealedGenerationName]}
                      onSelectionChange={(selectedKeys) => {
                        const selectedKey = [...selectedKeys].shift() as string;
                        setNotRevealedGenerationName(selectedKey);
                      }}
                    >
                      {({ name }) => <Item key={name}>{name}</Item>}
                    </Menu>
                  </MenuTrigger>
                </Preview>
              )}

              <Preview name="Collection" showName={true} url={url}>
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
              </Preview>
            </Flex>

            <Flex
              direction="column"
              justifyContent="center"
              alignItems="center"
            >
              <TextField
                width="100%"
                isReadOnly={true}
                label="Images CID"
                value={imagesCid}
              />

              <TextField
                width="100%"
                isReadOnly={true}
                label="Metadata CID"
                value={metadataCid}
              />

              {configuration.contractType === "721_reveal_pause" && (
                <>
                  <TextField
                    width="100%"
                    isReadOnly={true}
                    label="Not Revealed Image CID"
                    value={notRevealedImageCid}
                  />

                  <TextField
                    width="100%"
                    isReadOnly={true}
                    label="Not Revealed Metadata CID"
                    value={notRevealedMetadataCid}
                  />
                </>
              )}

              <TextField
                width="100%"
                isReadOnly={true}
                label="Contract Address"
                value={contractAddress}
              />
            </Flex>
          </Flex>

          <TriStateButton
            preLabel="Deploy"
            preAction={onDeploy}
            loading={isWorking}
            loadingDone={deployDone}
            loadingLabel="Deploying..."
            postLabel={`${dirty ? "* " : ""}Save`}
            postAction={onSave}
            postTooltip={true}
            postTooltipHeading="Elapsed time"
            postTooltipText={elapsedTime}
          />
        </>
      )}
    </Flex>
  );
}
