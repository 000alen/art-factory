import moment from "moment";
import React, { useEffect, useMemo, useState } from "react";
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
  Switch,
  TextField,
} from "@adobe/react-spectrum";
import Back from "@spectrum-icons/workflow/Back";
import More from "@spectrum-icons/workflow/More";
import WalletConnectQRCodeModal from "@walletconnect/qrcode-modal";

import { getGenerationPreview, save } from "../commands";
import { useErrorHandler } from "../components/ErrorHandler";
import { Preview } from "../components/Preview";
import { useToolbar } from "../components/Toolbar";
import { TriStateButton } from "../components/TriStateButton";
import { createProvider, factoryDeploy } from "../ipc";
import { Deployment, Instance, Network } from "../typings";

interface DeployPageState {
  projectDir: string;
  id: string;
  instance: Instance;
  dirty: boolean;
}

export function DeployPage() {
  useToolbar([
    {
      key: "back",
      label: "Exit without saving",
      icon: <Back />,
      onClick: () => onBack(),
    },
  ]);

  const navigate = useNavigate();
  const { state } = useLocation();
  const { projectDir, id, instance, dirty: _dirty } = state as DeployPageState;

  const { configuration, generations } = instance;

  // const [dirty, setDirty] = useState(_dirty);
  const [dirty] = useState(_dirty);

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
  const [network, setNetwork] = useState<Network>(Network.RINKEBY);

  const [automatic, setAutomatic] = useState(true);

  const [working, setWorking] = useState(false);
  const [deployDone, setDeployDone] = useState(false);
  const [elapsedTime, setElapsedTime] = useState<string>(null);

  // const task = useErrorHandler(setWorking);
  const task = useErrorHandler();

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
    navigate("/factory", { state: { projectDir, id, instance, dirty } });

  const onDeploy = task("deployment", async () => {
    setWorking(true);

    const providerId = uuid();
    const uri = await createProvider(
      providerId,
      network,
      async ({ connected }) => {
        WalletConnectQRCodeModal.close();

        if (!connected) throw new Error("Could not connect");

        const start = moment(performance.now());
        const {
          imagesCid: _imagesCid,
          metadataCid: _metadataCid,
          notRevealedImageCid: _notRevealedImageCid,
          notRevealedMetadataCid: _notRevealedMetadataCid,
          contractAddress: _contractAddress,
          abi,
          compilerVersion,
        } = await factoryDeploy(
          id,
          providerId,
          generation,
          notRevealedGeneration,

          imagesCid,
          metadataCid,
          notRevealedImageCid,
          notRevealedMetadataCid,
          contractAddress
        );
        const end = moment(performance.now());
        const diff = end.diff(start);

        setElapsedTime(moment.utc(diff).format("HH:mm:ss.SSS"));
        setImagesCid(_imagesCid);
        setMetadataCid(_metadataCid);
        setNotRevealedImageCid(_notRevealedImageCid);
        setNotRevealedMetadataCid(_notRevealedMetadataCid);
        setContractAddress(_contractAddress);
        setAbi(abi);
        setCompilerVersion(compilerVersion);
        setDeployDone(true);
        setWorking(false);
      }
    );
    WalletConnectQRCodeModal.open(uri, () => {});
  });

  const onSave = async () => {
    const deployment: Deployment = {
      imagesCid,
      metadataCid,
      notRevealedImageCid,
      notRevealedMetadataCid,
      contractAddress,
      abi,
      compilerVersion,
      network,
      generation: JSON.parse(JSON.stringify(generation)),
      dropNumber: 0,
    };

    const newInstance = {
      ...instance,
      deployment,
      frozen: true,
    };

    await save(projectDir, newInstance);

    navigate("/factory", {
      state: {
        projectDir,
        id,
        instance: newInstance,
        dirty: false,
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
              Deploy {configuration.contractType} to {network}
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
                  setNetwork([...selectedKeys].shift() as Network)
                }
              >
                <Item key="rinkeby">{Network.RINKEBY}</Item>
                <Item key="mainnet">{Network.MAIN}</Item>
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

            <Flex direction="column" justifyContent="center" gap="size-100">
              <Switch isSelected={automatic} onChange={setAutomatic}>
                Automatic
              </Switch>
              <TextField
                width="100%"
                isReadOnly={automatic}
                label="Images CID"
                value={imagesCid}
                onChange={setImagesCid}
              />

              <TextField
                width="100%"
                isReadOnly={automatic}
                label="Metadata CID"
                value={metadataCid}
                onChange={setMetadataCid}
              />

              {configuration.contractType === "721_reveal_pause" && (
                <>
                  <TextField
                    width="100%"
                    isReadOnly={automatic}
                    label="Not Revealed Image CID"
                    value={notRevealedImageCid}
                    onChange={setNotRevealedImageCid}
                  />

                  <TextField
                    width="100%"
                    isReadOnly={automatic}
                    label="Not Revealed Metadata CID"
                    value={notRevealedMetadataCid}
                    onChange={setNotRevealedMetadataCid}
                  />
                </>
              )}

              <TextField
                width="100%"
                isReadOnly={automatic}
                label="Contract Address"
                value={contractAddress}
                onChange={setContractAddress}
              />
            </Flex>
          </Flex>

          <TriStateButton
            preLabel="Deploy"
            preAction={onDeploy}
            loading={working}
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
