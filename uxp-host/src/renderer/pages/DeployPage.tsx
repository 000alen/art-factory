import React, { useState, useEffect, useContext } from "react";
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
} from "@adobe/react-spectrum";
import More from "@spectrum-icons/workflow/More";
import LogOut from "@spectrum-icons/workflow/LogOut";
import { Networks, ContractTypes } from "../constants";
import { ToolbarContext } from "../components/Toolbar";
import { useErrorHandler } from "../components/ErrorHandler";
import Close from "@spectrum-icons/workflow/Close";
import { TriStateButton } from "../components/TriStateButton";
import { Instance } from "../typings";
import Back from "@spectrum-icons/workflow/Back";
import { resolveEtherscanUrl } from "../utils";

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
