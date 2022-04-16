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
  const [url, setUrl] = useState<string>(null);

  const [generation, setGeneration] = useState(generations[0]);
  const [generationName, setGenerationName] = useState(generation.name);

  const [networkKey, setNetworkKey] = useState("rinkeby");

  const [imagesCid, setImagesCid] = useState<string>(null);
  const [metadataCid, setMetadataCid] = useState<string>(null);
  const [notRevealedImageCid, setNotRevealedImageCid] = useState<string>(null);
  const [notRevealedMetadataCid, setNotRevealedMetadataCid] =
    useState<string>(null);
  const [contractAddress, setContractAddress] = useState<string>(null);
  const [abi, setAbi] = useState<any>(null);
  const [compilerVersion, setCompilerVersion] = useState<string>(null);

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
      const generation = generations.find((g) => g.name === generationName);
      setUrl(await getGenerationPreview(id, generation));
      setGeneration(generation);
    })();
  }, [generationName]);

  const generationItems = useMemo(
    () =>
      generations.map(({ name }) => ({
        name,
      })),
    []
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
      } = await factoryDeploy(id, providerId, generation);
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
            <div className="relative w-48 p-3 border-1 border-solid border-white rounded">
              <Flex direction="column" gap="size-100">
                {url ? (
                  <ImageItem src={url} maxSize={192} />
                ) : (
                  <div className="w-48 h-48 flex justify-center items-center">
                    <Text>Nothing to see here</Text>
                  </div>
                )}

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
              </Flex>
            </div>
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
    </Flex>
  );
}
