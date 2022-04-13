import React, { useState, useEffect, useContext } from "react";
import useStateRef from "react-usestateref";
import { useNavigate, useLocation } from "react-router-dom";
import WalletConnectProvider from "@walletconnect/web3-provider";
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
  ListBox,
} from "@adobe/react-spectrum";
import { providers } from "ethers";
import More from "@spectrum-icons/workflow/More";
import LogOut from "@spectrum-icons/workflow/LogOut";
import { Networks, ContractTypes } from "../constants";
import { ToolbarContext } from "../components/Toolbar";
import {
  factoryDeployAssets,
  factoryDeployContract,
  loadSecrets,
} from "../actions";
import { useErrorHandler } from "../components/ErrorHandler";
import Close from "@spectrum-icons/workflow/Close";
import { TriStateButton } from "../components/TriStateButton";
import {
  Bundles,
  Collection,
  Configuration,
  Instance,
  Network,
} from "../typings";
import Back from "@spectrum-icons/workflow/Back";
import { resolveEtherscanUrl } from "../utils";
import { factoryUnify } from "../ipc";
import { ArrayOf } from "../components/ArrayOf";

interface DeployPageState {
  projectDir: string;
  instance: Instance;
  id: string;
}

// TODO: Verify the contract
// https://docs.opensea.io/docs/metadata-standards
export function DeployPage() {
  const toolbarContext = useContext(ToolbarContext);
  const task = useErrorHandler();

  const navigate = useNavigate();
  const { state } = useLocation();
  const { projectDir, instance, id } = state as DeployPageState;
  const { configuration, generations } = instance;

  const [secrets, setSecrets] = useState(null);
  const [provider, setProvider] = useState(null);
  const [imagesCid, setImagesCid] = useState("");
  const [metadataCid, setMetadataCid] = useState("");
  const [transactionHash, setTransactionHash] = useState("");
  const [contractAddress, setContractAddress] = useState("");
  const [abi, setAbi] = useState(null);
  const [deployedDone, setDeployedDone, deployedDoneRef] = useStateRef(false);
  const [networkKey, setNetworkKey] = useState("rinkeby");

  const [isWorking, setIsWorking] = useState(false);
  const [timerId, setTimerId] = useState(null);
  const [contractAddressTooltipShown, setContractAddressTooltipShown] =
    useState(false);

  const [generationsToUnify, setGenerationsToUnify] = useState<string[]>([]);
  const [collection, setCollection] = useState<Collection>(null);
  const [bundles, setBundles] = useState<Bundles>(null);

  // useEffect(() => () => clearTimeout(timerId), [timerId]);

  useEffect(() => {
    toolbarContext.addButton("close", "Close", <Close />, () => navigate("/"));
    toolbarContext.addButton("back", "Back", <Back />, () =>
      navigate("/factory", {
        state: {
          projectDir,
          instance,
          id,
        },
      })
    );
    toolbarContext.addButton("logOut", "Log Out", <LogOut />, () =>
      localStorage.clear()
    );

    // task("loading secrets", async () => {
    //   const secrets = await loadSecrets();
    //   const provider = new WalletConnectProvider({
    //     infuraId: secrets.infuraProjectId,
    //     chainId: Networks[networkKey].id as number,
    //   });

    //   setSecrets(secrets);
    //   setProvider(provider);
    // })();

    return () => {
      toolbarContext.removeButton("close");
      toolbarContext.removeButton("back");
      toolbarContext.removeButton("logOut");
    };
  }, [networkKey]);

  const onDeploy = task("deployment", async () => {
    // setIsWorking(true);
    // await provider.enable();
    // const web3Provider = new providers.Web3Provider(provider);
    // const signer = await web3Provider.getSigner();
    // const {
    //   imagesCid,
    //   metadataCid,
    //   notRevealedImageCid,
    //   notRevealedMetadataCid,
    // } = await factoryDeployAssets(
    //   id,
    //   secrets,
    //   "LOREM", // ! TODO
    //   collection,
    //   configuration,
    //   partialDeploy
    // );
    // setImagesCid(imagesCid);
    // setMetadataCid(metadataCid);
    // const { contractAddress, abi, transactionHash, wait } =
    //   await factoryDeployContract(
    //     id,
    //     configuration,
    //     Network.RINKEBY,
    //     // networkKey === "rinkeby" ? ,
    //     signer,
    //     metadataCid,
    //     notRevealedMetadataCid
    //   );
    // setContractAddress(contractAddress);
    // setAbi(abi);
    // setTransactionHash(transactionHash);
    // const timerId = setTimeout(() => {
    //   if (!deployedDoneRef.current) setContractAddressTooltipShown(true);
    // }, 30 * 1000);
    // setTimerId(timerId);
    // await wait;
    // setDeployedDone(true);
    // setIsWorking(false);

    const { collection, bundles } = await factoryUnify(
      id,
      generationsToUnify.map((id) =>
        generations.find(({ name }) => name === id)
      )
    );

    setCollection(collection);
    setBundles(bundles);
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

  interface GenerationItemProps {
    value: string;
    onChange: (value: string) => void;
  }

  const generationItems = generations.map(({ name }) => ({
    name,
  }));

  const emptyValue = generations[0].name;

  const GenerationItem: React.FC<GenerationItemProps> = ({
    value,
    onChange,
  }) => {
    return (
      <MenuTrigger>
        <ActionButton width="100%">{value}</ActionButton>
        <Menu
          items={generationItems}
          selectionMode="single"
          disallowEmptySelection={true}
          selectedKeys={[value]}
          onSelectionChange={(selectedKeys) => {
            const selectedKey = [...selectedKeys].shift() as string;
            onChange(selectedKey);
          }}
        >
          {({ name }) => <Item key={name}>{name}</Item>}
        </Menu>
      </MenuTrigger>
    );
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
          Deploy {ContractTypes[configuration.contractType].name} to{" "}
          {Networks[networkKey].name}
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
        <Flex direction="column" justifyContent="center" alignItems="center">
          <TextField
            width="100%"
            isReadOnly={true}
            value={imagesCid}
            label="Images CID"
          />

          <TextField
            width="100%"
            isReadOnly={true}
            value={metadataCid}
            label="Metadata CID"
          />

          <Flex width="100%" gap="size-100" alignItems="end">
            <TextField
              width="100%"
              isReadOnly={true}
              value={contractAddress}
              label="Contract Address"
            />
            {contractAddressTooltipShown && (
              <ContextualHelp variant="help" defaultOpen>
                <Heading>Transaction isn't loading?</Heading>
                <Content>
                  <Flex direction="column" gap="size-100">
                    <Text>
                      You can check the transaction status in Etherscan, and if
                      it is already processed, you can choose to continue.
                    </Text>
                    <Link>
                      <a
                        href={resolveEtherscanUrl(
                          Networks[networkKey],
                          transactionHash
                        )}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Transaction at Etherscan.
                      </a>
                    </Link>
                  </Flex>
                </Content>
              </ContextualHelp>
            )}
          </Flex>
        </Flex>

        <ArrayOf
          Component={GenerationItem}
          label="Generations"
          heading={true}
          moveable={true}
          emptyValue={emptyValue}
          items={generationsToUnify}
          setItems={setGenerationsToUnify}
        />
      </Flex>

      <TriStateButton
        preLabel="Deploy"
        preAction={onDeploy}
        loading={isWorking}
        loadingDone={deployedDone}
        loadingLabel="Deploying…"
        postLabel="Save"
        postAction={onSave}
      />
    </Flex>
  );
}
