import React, { useState, useEffect, useContext } from "react";
import useStateRef from "react-usestateref";
import { useNavigate, useLocation } from "react-router-dom";
import WalletConnectProvider from "@walletconnect/web3-provider";
import {
  Button,
  TextField,
  Flex,
  ButtonGroup,
  Heading,
  ProgressBar,
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

function resolveEtherscanUrl(network, transactionHash) {
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
    attributes,
    inputDir,
    outputDir,
    photoshop,
    configuration,
    partialDeploy,
  } = state;

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

    toolbarContext.addButton("logOut", "Log Out", <LogOut UNSAFE_className="fix-icon-size"/>, () =>
      localStorage.clear()
    );

    const loadSecrets = async () => {
      const secrets = await Promise.all([
        await getPinataApiKey(),
        await getPinataSecretApiKey(),
        await getInfuraId(),
        await getEtherscanApiKey(),
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
          chainId: Networks[networkKey].id,
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
    const web3Provider = new providers.Web3Provider(provider);
    const signer = await web3Provider.getSigner();

    const { imagesCID, metadataCID } = await factoryDeployAssets(
      id,
      secrets,
      attributes,
      partialDeploy
    );

    await factorySaveInstance(id);
    setImagesCID(imagesCID);
    setMetadataCID(metadataCID);

    const { contractAddress, abi, transactionHash, wait } =
      await factoryDeployContract(
        id,
        configuration,
        networkKey,
        signer,
        metadataCID
      );
    setContractAddress(contractAddress);
    setAbi(abi);
    setTransactionHash(transactionHash);

    const timerId = setTimeout(() => {
      if (!deployedDoneRef.current) setContractAddressTooltipShown(true);
    }, 30 * 1000);
    setTimerId(timerId);

    await wait;

    setDeployedDone(true);
  });

  const onContinue = () => {
    navigate("/instance", {
      state: {
        id,
        attributes,
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
          Deploy {ContractTypes[configuration.contractType].name} to{" "}
          {Networks[networkKey].name}
        </Heading>
        <MenuTrigger>
          <ActionButton>
            <More />
          </ActionButton>
          <Menu
            selectionMode="single"
            selectedKeys={[networkKey]}
            disallowEmptySelection={true}
            onSelectionChange={(selectedKeys) =>
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
                        Networks[networkKey],
                        transactionHash
                      )}
                      target="_blank"
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

      {isWorking ? (
        <Flex marginBottom={8} marginX={8} justifyContent="end">
          <ProgressBar label="Deploying…" isIndeterminate />
        </Flex>
      ) : (
        <ButtonGroup align="end" marginBottom={8} marginEnd={8}>
          {deployedDone ? (
            <Button variant="cta" onPress={onContinue}>
              Continue!
            </Button>
          ) : (
            <Button variant="cta" onPress={onDeploy}>
              Deploy!
            </Button>
          )}
        </ButtonGroup>
      )}
    </Flex>
  );
}
