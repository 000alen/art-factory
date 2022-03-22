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
} from "@adobe/react-spectrum";
import {
  factorySaveInstance,
  getEtherscanApiKey,
  getInfuraId,
  getPinataApiKey,
  getPinataSecretApiKey,
} from "../ipc";
import { providers } from "ethers";
import More from "@spectrum-icons/workflow/More";
import LogOut from "@spectrum-icons/workflow/LogOut";
import { Networks, ContractTypes } from "../constants";
import { GenericDialogContext } from "../components/GenericDialog";
import { ToolbarContext } from "../components/Toolbar";
import { factoryDeployAssets, factoryDeployContract } from "../actions";
import { useErrorHandler } from "../components/ErrorHandler";
import Close from "@spectrum-icons/workflow/Close";
import { TriStateButton } from "../components/TriStateButton";
import { Collection, Configuration } from "../typings";

interface DeployPageState {
  id: string;
  collection: Collection;
  inputDir: string;
  outputDir: string;
  photoshop: boolean;
  configuration: Configuration;
  partialDeploy: any;
}

function resolveEtherscanUrl(
  network: { name: string; id: number },
  transactionHash: string
) {
  return network === Networks.mainnet
    ? `https://etherscan.io/tx/${transactionHash}`
    : network === Networks.ropsten
    ? `https://ropsten.etherscan.io/tx/${transactionHash}`
    : network === Networks.rinkeby
    ? `https://rinkeby.etherscan.io/tx/${transactionHash}`
    : null;
}

// ! TODO: Verify the contract
// ! TODO: Metadata for grouping in OpenSea
// https://docs.opensea.io/docs/metadata-standards
export function DeployPage() {
  const genericDialogContext = useContext(GenericDialogContext);
  const toolbarContext = useContext(ToolbarContext);
  const { task, isWorking } = useErrorHandler(genericDialogContext);

  const navigate = useNavigate();
  const { state } = useLocation();
  const {
    id,
    collection,
    inputDir,
    outputDir,
    photoshop,
    configuration,
    partialDeploy,
  } = state as DeployPageState;

  const [secrets, setSecrets] = useState(null);
  const [provider, setProvider] = useState(null);
  const [imagesCID, setImagesCID] = useState("");
  const [metadataCID, setMetadataCID] = useState("");
  const [transactionHash, setTransactionHash] = useState("");
  const [contractAddress, setContractAddress] = useState("");
  const [abi, setAbi] = useState(null);
  const [deployedDone, setDeployedDone, deployedDoneRef] = useStateRef(false);
  const [networkKey, setNetworkKey] = useState("rinkeby");

  const [timerId, setTimerId] = useState(null);
  const [contractAddressTooltipShown, setContractAddressTooltipShown] =
    useState(false);

  useEffect(() => () => clearTimeout(timerId), [timerId]);

  useEffect(() => {
    toolbarContext.addButton("close", "Close", <Close />, () => navigate("/"));

    toolbarContext.addButton("logOut", "Log Out", <LogOut />, () =>
      localStorage.clear()
    );

    const loadSecrets = async () => {
      const secrets = await Promise.all([
        // @ts-ignore
        (await getPinataApiKey()) as string,
        // @ts-ignore
        (await getPinataSecretApiKey()) as string,
        // @ts-ignore
        (await getInfuraId()) as string,
        // @ts-ignore
        (await getEtherscanApiKey()) as string,
      ]);

      const [pinataApiKey, pinataSecretApiKey, infuraId, etherscanApiKey] =
        secrets;

      return {
        pinataApiKey,
        pinataSecretApiKey,
        infuraId,
        etherscanApiKey,
      };
    };

    let _secrets;
    let _provider;

    loadSecrets()
      .then((__secrets) => {
        _secrets = __secrets;

        _provider = new WalletConnectProvider({
          infuraId: _secrets.infuraId,
          // @ts-ignore
          chainId: Networks[networkKey].id as number,
        });

        setSecrets(_secrets);
        setProvider(_provider);
      })
      .catch((error) => {
        genericDialogContext.show("Error", error.message, null);
        return;
      });

    return () => {
      toolbarContext.removeButton("close");
      toolbarContext.removeButton("logOut");
    };
  }, [networkKey]);

  const onDeploy = task("deployment", async () => {
    await provider.enable();
    // const web3Provider = new providers.Web3Provider(provider);
    // const signer = await web3Provider.getSigner();
    // const { imagesCid, metadataCid } = await factoryDeployAssets(
    //   id,
    //   secrets,
    //   collection,
    //   partialDeploy
    // );
    // await factorySaveInstance(id);
    // setImagesCID(imagesCid);
    // setMetadataCID(metadataCid);
    // const { contractAddress, abi, transactionHash, wait } =
    //   await factoryDeployContract(
    //     id,
    //     configuration,
    //     networkKey,
    //     signer,
    //     metadataCid
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
  });

  const onContinue = () => {
    navigate("/instance", {
      state: {
        id,
        attributes: collection,
        inputDir,
        outputDir,
        photoshop,
        configuration,
        imagesCID,
        metadataCID,
        network: networkKey,
        contractAddress,
        abi,
      },
    });
  };

  return (
    <Flex direction="column" height="100%" margin="size-100" gap="size-100">
      <Flex gap="size-100" alignItems="center">
        <Heading level={1} marginStart={16}>
          {/* @ts-ignore */}
          Deploy {ContractTypes[configuration.contractType].name}{" "}
          {/* @ts-ignore */}
          to {Networks[networkKey].name}
        </Heading>
        <MenuTrigger>
          <ActionButton>
            <More />
          </ActionButton>
          <Menu
            selectionMode="single"
            disallowEmptySelection={true}
            selectedKeys={[networkKey]}
            onSelectionChange={(selectedKeys) =>
              // @ts-ignore
              setNetworkKey([...selectedKeys].shift())
            }
          >
            <Item key="mainnet">{Networks["mainnet"].name}</Item>
            <Item key="ropsten">{Networks["ropsten"].name}</Item>
            <Item key="rinkeby">{Networks["rinkeby"].name}</Item>
          </Menu>
        </MenuTrigger>
      </Flex>

      <Flex
        direction="column"
        height="100%"
        justifyContent="center"
        alignItems="center"
      >
        <TextField
          width="50%"
          isReadOnly={true}
          value={imagesCID}
          label="Images CID"
        />

        <TextField
          width="50%"
          isReadOnly={true}
          value={metadataCID}
          label="Metadata CID"
        />

        <Flex width="50%" gap="size-100" alignItems="end">
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
                    You can check the transaction status in Etherscan, and if it
                    is already processed, you can choose to continue.
                  </Text>
                  <Link>
                    <a
                      href={resolveEtherscanUrl(
                        // @ts-ignore
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

      <TriStateButton
        preLabel="Deploy"
        preAction={onDeploy}
        loading={isWorking}
        loadingDone={deployedDone}
        loadingLabel="Deploying…"
        postLabel="Continue"
        postAction={onContinue}
      />
    </Flex>
  );
}
