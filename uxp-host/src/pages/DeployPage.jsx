import React, { useState, useEffect, useContext } from "react";
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
  Text,
  ActionButton,
  ProgressCircle,
} from "@adobe/react-spectrum";
import {
  factoryDeployImages,
  factoryDeployMetadata,
  factoryGenerateMetadata,
  factoryLoadSecrets,
  getContract,
  getInfuraId,
  getPinataApiKey,
  getPinataSecretApiKey,
} from "../ipc";
import { providers, ContractFactory, ethers } from "ethers";
import { DialogContext } from "../App";
import More from "@spectrum-icons/workflow/More";
import { capitalize } from "../utils";

// ! TODO:
// Choose the network to deploy and verify the contract
export function DeployPage() {
  const dialogContext = useContext(DialogContext);
  const navigator = useNavigate();
  const { state } = useLocation();
  const { id, attributes, inputDir, outputDir, configuration } = state;

  const [secrets, setSecrets] = useState(null);
  const [provider, setProvider] = useState(null);
  const [web3Provider, setWeb3Provider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [imagesCID, setImagesCID] = useState("");
  const [metadataCID, setMetadataCID] = useState("");
  const [contractAddress, setContractAddress] = useState("");
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployedDone, setDeployedDone] = useState(false);
  const [network, setNetwork] = useState(new Set(["rinkeby"]));

  const loadSecrets = async () => ({
    pinataApiKey: await getPinataApiKey(),
    pinataSecretApiKey: await getPinataSecretApiKey(),
    infuraId: await getInfuraId(),
  });

  useEffect(() => {
    let _secrets;
    let _provider;

    loadSecrets()
      .then((__secrets) => {
        _secrets = __secrets;

        _provider = new WalletConnectProvider({
          infuraId: _secrets.infuraId,
          chainId: 3, // ! TODO
        });

        setSecrets(_secrets);
        setProvider(_provider);
      })
      .catch((error) => {
        dialogContext.setDialog("Error", error.message, null, true);
        return;
      });
  }, []);

  const onDeploy = async () => {
    setIsDeploying(true);

    // TODO
    await provider.enable();
    const _web3Provider = new providers.Web3Provider(provider);
    const _signer = await _web3Provider.getSigner();

    let _imagesCID;
    let _metadataCID;

    setWeb3Provider(_web3Provider);
    setSigner(_signer);

    // ! TODO
    try {
      await factoryLoadSecrets(id, secrets);
      _imagesCID = await factoryDeployImages(id);
      await factoryGenerateMetadata(id, _imagesCID, attributes);
      _metadataCID = await factoryDeployMetadata(id);
    } catch (error) {
      dialogContext.setDialog("Error", error.message, null, true);
      return;
    }

    setImagesCID(_imagesCID);
    setMetadataCID(_metadataCID);

    let _contractAddress;

    // ! TODO
    try {
      const { contracts } = await getContract("NFT");
      const { NFT } = contracts.NFT;
      const { abi, evm } = NFT;
      const { bytecode } = evm;
      const contractFactory = new ContractFactory(abi, bytecode, _signer);

      const contract = await contractFactory.deploy(
        configuration.name,
        configuration.symbol,
        _metadataCID,
        _metadataCID,
        {
          gasPrice: ethers.utils.parseUnits("10", "gwei"),
        }
      );

      await contract.deployTransaction.wait();
      _contractAddress = contract.address;
    } catch (error) {
      dialogContext.setDialog("Error", error.message, null, true);
      return;
    }

    setContractAddress(_contractAddress);
    setDeployedDone(true);
    setIsDeploying(false);
  };

  const onContinue = () => {
    navigator("/instance", {
      state: {
        id,
        attributes,
        inputDir,
        outputDir,
        configuration,
        imagesCID,
        metadataCID,
        contractAddress,
      },
    });
  };

  return (
    <Flex direction="column" height="100%" margin="size-100" gap="size-100">
      <Flex gap="size-100" alignItems="center">
        <Heading level={1} marginStart={16}>
          Deploy to {capitalize([...network].shift())}
        </Heading>
        <MenuTrigger>
          <ActionButton>
            <More />
          </ActionButton>
          <Menu
            selectionMode="single"
            selectedKeys={network}
            onSelectionChange={setNetwork}
          >
            <Item key="mainnet">Mainnet</Item>
            <Item key="ropsten">Ropsten</Item>
            <Item key="rinkeby">Rinkeby</Item>
          </Menu>
        </MenuTrigger>
      </Flex>

      <Flex
        direction="column"
        height="100%"
        justifyContent="center"
        alignItems="center"
      >
        <Flex width="50%" gap="size-100" alignItems="center">
          <ProgressCircle aria-label="Loading…" size="S" isIndeterminate />

          <TextField
            width="100%"
            isReadOnly={true}
            value={imagesCID}
            label="Images CID"
          />
        </Flex>

        <Flex width="50%" gap="size-100" alignItems="center">
          <ProgressCircle aria-label="Loading…" size="S" isIndeterminate />
          <TextField
            width="100%"
            isReadOnly={true}
            value={metadataCID}
            label="Metadata CID"
          />
        </Flex>

        <Flex width="50%" gap="size-100" alignItems="center">
          <ProgressCircle aria-label="Loading…" size="S" isIndeterminate />
          <TextField
            width="100%"
            isReadOnly={true}
            value={contractAddress}
            label="Contract Address"
          />
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
