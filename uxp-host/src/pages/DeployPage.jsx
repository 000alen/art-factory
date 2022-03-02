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
  factoryDeployImages,
  factoryDeployMetadata,
  factoryGenerateMetadata,
  factoryLoadSecrets,
  factorySaveInstance,
  factorySetProps,
  getContract,
  getContractSource,
  getEtherscanApiKey,
  getInfuraId,
  getPinataApiKey,
  getPinataSecretApiKey,
  verifyContract,
} from "../ipc";
import { providers, ContractFactory, utils } from "ethers";
import More from "@spectrum-icons/workflow/More";
import LogOut from "@spectrum-icons/workflow/LogOut";
import { Networks, ContractTypes } from "../constants";
import { GenericDialogContext } from "../components/GenericDialog";
import { ToolbarContext } from "../components/Toolbar";

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
export function DeployPage() {
  const genericDialogContext = useContext(GenericDialogContext);
  const toolbarContext = useContext(ToolbarContext);
  const navigator = useNavigate();
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
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployedDone, setDeployedDone, deployedDoneRef] = useStateRef(false);
  const [networkKey, setNetworkKey] = useState("rinkeby");

  const [timerId, setTimerId] = useState(null);
  const [contractAddressTooltipShown, setContractAddressTooltipShown] =
    useState(false);
  const [
    contractAddressTooltipLinkPressed,
    setContractAddressTooltipLinkPressed,
  ] = useState(false);

  useEffect(() => () => clearTimeout(timerId), [timerId]);

  useEffect(() => {
    toolbarContext.addButton("logOut", "Log Out", <LogOut />, () =>
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

      // if (!pinataApiKey) {
      //   genericDialogContext.show("Missing Pinata API Key", "! TODO", null);
      //   return;
      // }

      // if (!pinataSecretApiKey) {
      //   genericDialogContext.show(
      //     "Missing Pinata Secret API Key",
      //     "! TODO",
      //     null
      //   );
      //   return;
      // }

      // if (!infuraId) {
      //   genericDialogContext.show("Missing Infura ID", "! TODO", null);
      //   return;
      // }

      // if (!etherscanApiKey) {
      //   genericDialogContext.show("Missing Infura ID", "! TODO", null);
      //   return;
      // }

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
      toolbarContext.removeButton("logOut");
    };
  }, [networkKey]);

  const onDeploy = async () => {
    setIsDeploying(true);

    await provider.enable();
    const _web3Provider = new providers.Web3Provider(provider);
    const _signer = await _web3Provider.getSigner();

    let _imagesCID;
    let _metadataCID;

    // ! TODO: Proper error handling
    // ! TODO: For ERC721, deploy notRevealedFile and its metadata if needed
    try {
      if (partialDeploy) {
        _imagesCID = partialDeploy.imagesCID;
        _metadataCID = partialDeploy.metadataCID;

        await factorySetProps(id, {
          imagesCID: _imagesCID,
          metadataCID: _metadataCID,
        });
      } else {
        await factoryLoadSecrets(id, secrets);
        _imagesCID = await factoryDeployImages(id);
        await factoryGenerateMetadata(id, _imagesCID, attributes);
        _metadataCID = await factoryDeployMetadata(id);
      }
    } catch (error) {
      genericDialogContext.show("Error", error.message, null);
      return;
    }

    await factorySaveInstance(id);
    setImagesCID(_imagesCID);
    setMetadataCID(_metadataCID);

    let _contractAddress;
    let _abi;

    try {
      const { contracts } = await getContract(configuration.contractType);
      const source = await getContractSource(configuration.contractType);

      const { NFT } = contracts[configuration.contractType];
      const metadata = JSON.parse(NFT.metadata);
      const { version } = metadata.compiler;

      console.log(version);

      ({ abi: _abi } = NFT);
      const { evm } = NFT;
      const { bytecode } = evm;
      const contractFactory = new ContractFactory(_abi, bytecode, _signer);

      const contract =
        configuration.contractType === "721"
          ? await contractFactory.deploy(
              configuration.name,
              configuration.symbol,
              `ipfs://${_metadataCID}/`,
              `ipfs://${_metadataCID}/1.json`, // ! TODO: For ERC721, deploy notRevealedFile and its metadata if needed
              utils.parseEther(configuration.cost),
              configuration.n,
              configuration.maxMintAmount,
              configuration.revealed
            )
          : await contractFactory.deploy(
              configuration.name,
              configuration.symbol,
              `ipfs://${_metadataCID}/`
            );

      _contractAddress = contract.address;

      await factorySetProps(id, {
        network: networkKey,
        contractAddress: _contractAddress,
        abi: _abi,
        compilerVersion: version,
      });
      await factorySaveInstance(id);

      setContractAddress(_contractAddress);
      setAbi(_abi);

      setTransactionHash(contract.deployTransaction.hash);
      const timerId = setTimeout(() => {
        if (!deployedDoneRef.current) setContractAddressTooltipShown(true);
      }, 30 * 1000);
      setTimerId(timerId);

      console.log("pre-wait");

      await contract.deployTransaction.wait();

      console.log("post-wait");

      console.log("pre-verify");

      const x = await verifyContract(
        secrets.etherscanApiKey,
        source,
        networkKey,
        _contractAddress,
        "solidity-single-file",
        "NFT",
        version,
        0
      );

      console.log(x);
      console.log("pre-verify");
    } catch (error) {
      setIsDeploying(false);
      setDeployedDone(true);

      console.log("error", error);

      genericDialogContext.show("Error", error.message, null);
      return;
    }

    setIsDeploying(false);
    setDeployedDone(true);
  };

  const onContinue = async () => {
    await factorySetProps(id, {
      contractAddress,
    });
    await factorySaveInstance(id);

    navigator("/instance", {
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
                  <Link
                    onPress={() => setContractAddressTooltipLinkPressed(true)}
                  >
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
                  <Button
                    isDisabled={!contractAddressTooltipLinkPressed}
                    onPress={() => {
                      setIsDeploying(false);
                      setDeployedDone(true);
                    }}
                  >
                    The transaction is already deployed
                  </Button>
                </Flex>
              </Content>
            </ContextualHelp>
          )}
        </Flex>
      </Flex>

      {isDeploying ? (
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
